using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace PlantWidget.Services;

/// <summary>
/// Minimal HTTP server for LAN sync with the phone. Deliberately implemented over a raw
/// TcpListener rather than HttpListener: HttpListener needs admin rights (or a netsh urlacl
/// reservation) to accept non-loopback connections on Windows, which isn't realistic to ask
/// of a regular user of this widget.
/// </summary>
public class LocalSyncServer
{
    public const int Port = 8787;

    private static readonly JsonSerializerOptions WireJsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private readonly PlantStore _store;
    private readonly Action _onPlantsChanged;
    private TcpListener? _listener;
    private CancellationTokenSource? _cts;

    public LocalSyncServer(PlantStore store, Action onPlantsChanged)
    {
        _store = store;
        _onPlantsChanged = onPlantsChanged;
    }

    public void Start()
    {
        _cts = new CancellationTokenSource();
        _listener = new TcpListener(IPAddress.Any, Port);
        _listener.Start();
        _ = AcceptLoopAsync(_listener, _cts.Token);
    }

    public void Stop()
    {
        _cts?.Cancel();
        _listener?.Stop();
    }

    /// <summary>Best-effort local IPv4 address to show the user for pairing with the phone.</summary>
    public static string? GetLocalIPv4()
    {
        foreach (var ni in NetworkInterface.GetAllNetworkInterfaces())
        {
            if (ni.OperationalStatus != OperationalStatus.Up) continue;
            if (ni.NetworkInterfaceType == NetworkInterfaceType.Loopback) continue;

            foreach (var addr in ni.GetIPProperties().UnicastAddresses)
            {
                if (addr.Address.AddressFamily == AddressFamily.InterNetwork)
                    return addr.Address.ToString();
            }
        }
        return null;
    }

    private async Task AcceptLoopAsync(TcpListener listener, CancellationToken token)
    {
        while (!token.IsCancellationRequested)
        {
            TcpClient client;
            try
            {
                client = await listener.AcceptTcpClientAsync(token);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (ObjectDisposedException)
            {
                break;
            }
            catch (SocketException)
            {
                continue;
            }

            _ = HandleClientAsync(client);
        }
    }

    private async Task HandleClientAsync(TcpClient client)
    {
        using (client)
        {
            client.ReceiveTimeout = 10_000;
            client.SendTimeout = 10_000;
            var stream = client.GetStream();

            try
            {
                var (method, path, body) = await ReadRequestAsync(stream);

                if (method == "GET" && path == "/ping")
                {
                    await WriteResponseAsync(stream, 200, "text/plain", "ok");
                }
                else if (method == "POST" && path == "/sync")
                {
                    var payload = JsonSerializer.Deserialize<SyncPayload>(body, WireJsonOptions) ?? new SyncPayload();
                    var local = _store.Load();
                    var merged = PlantSyncMerger.Merge(local, payload.Plants);
                    _store.Save(merged);
                    _onPlantsChanged();

                    var responseJson = JsonSerializer.Serialize(
                        new SyncPayload { Plants = merged.ConvertAll(PlantMapper.ToDto) },
                        WireJsonOptions);
                    await WriteResponseAsync(stream, 200, "application/json", responseJson);
                }
                else
                {
                    await WriteResponseAsync(stream, 404, "text/plain", "not found");
                }
            }
            catch
            {
                try { await WriteResponseAsync(stream, 400, "text/plain", "bad request"); }
                catch { /* client already disconnected */ }
            }
        }
    }

    /// <summary>
    /// Reads and parses the request as raw bytes throughout. Bodies (plant names are often
    /// Cyrillic) are UTF-8, which is variable-width, so byte counts (Content-Length) and char
    /// counts differ — mixing a char-based reader with a byte-counted length previously caused
    /// the read loop to wait for characters that would never arrive, hanging until the client
    /// timed out. Decoding to a string happens only once, after the exact byte count is in hand.
    /// </summary>
    private static async Task<(string Method, string Path, string Body)> ReadRequestAsync(NetworkStream stream)
    {
        using var raw = new MemoryStream();
        var chunk = new byte[4096];
        int headerEnd;

        while (true)
        {
            var n = await stream.ReadAsync(chunk, 0, chunk.Length);
            if (n == 0) throw new IOException("Connection closed before headers were complete");
            raw.Write(chunk, 0, n);

            headerEnd = IndexOfHeaderTerminator(raw.GetBuffer(), (int)raw.Length);
            if (headerEnd >= 0) break;
        }

        var allBytes = raw.GetBuffer();
        var totalLength = (int)raw.Length;
        var headerText = Encoding.ASCII.GetString(allBytes, 0, headerEnd);
        var lines = headerText.Split("\r\n", StringSplitOptions.RemoveEmptyEntries);

        var requestLine = lines.Length > 0 ? lines[0] : "";
        var parts = requestLine.Split(' ');
        var method = parts.Length > 0 ? parts[0] : "";
        var path = parts.Length > 1 ? parts[1] : "/";

        var contentLength = 0;
        for (var i = 1; i < lines.Length; i++)
        {
            if (lines[i].StartsWith("Content-Length:", StringComparison.OrdinalIgnoreCase))
                int.TryParse(lines[i]["Content-Length:".Length..].Trim(), out contentLength);
        }

        var bodyStart = headerEnd + 4; // skip the \r\n\r\n terminator
        var alreadyBuffered = Math.Max(0, totalLength - bodyStart);

        var body = new byte[contentLength];
        var read = Math.Min(alreadyBuffered, contentLength);
        if (read > 0)
            Array.Copy(allBytes, bodyStart, body, 0, read);

        while (read < contentLength)
        {
            var n = await stream.ReadAsync(body, read, contentLength - read);
            if (n == 0) break;
            read += n;
        }

        return (method, path, Encoding.UTF8.GetString(body, 0, read));
    }

    private static int IndexOfHeaderTerminator(byte[] buffer, int length)
    {
        for (var i = 0; i + 3 < length; i++)
        {
            if (buffer[i] == (byte)'\r' && buffer[i + 1] == (byte)'\n' &&
                buffer[i + 2] == (byte)'\r' && buffer[i + 3] == (byte)'\n')
                return i;
        }
        return -1;
    }

    private static async Task WriteResponseAsync(NetworkStream stream, int statusCode, string contentType, string body)
    {
        var statusText = statusCode switch
        {
            200 => "OK",
            400 => "Bad Request",
            404 => "Not Found",
            _ => "Error",
        };
        var bodyBytes = Encoding.UTF8.GetBytes(body);
        var header =
            $"HTTP/1.1 {statusCode} {statusText}\r\n" +
            $"Content-Type: {contentType}; charset=utf-8\r\n" +
            $"Content-Length: {bodyBytes.Length}\r\n" +
            "Connection: close\r\n\r\n";

        await stream.WriteAsync(Encoding.ASCII.GetBytes(header));
        await stream.WriteAsync(bodyBytes);
        await stream.FlushAsync();
    }

    private class SyncPayload
    {
        public List<PlantDto> Plants { get; set; } = new();
    }
}
