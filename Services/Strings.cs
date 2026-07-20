using System;
using System.Collections.Generic;

namespace PlantWidget.Services;

/// <summary>
/// Hand-rolled localization: small enough app that resx/satellite assemblies would be
/// overkill. Text lives in one table below; PlantItem/MainWindow/etc. re-pull it via
/// T(key) and refresh their bound properties when LanguageChanged fires, so switching
/// language in Settings updates the open UI without restarting the app.
/// </summary>
public static class Strings
{
    public static event Action? LanguageChanged;

    private static string _language = "ru";
    public static string Language => _language;

    private static readonly Dictionary<string, (string ru, string en)> Table = new()
    {
        ["app_title"] = ("Мои цветы", "My Plants"),
        ["tray_text"] = ("Полив цветов", "Plant Watering"),
        ["tray_show"] = ("Показать виджет", "Show widget"),
        ["tray_exit"] = ("Выход", "Exit"),
        ["settings_tooltip"] = ("Настройки", "Settings"),
        ["add_plant_tooltip"] = ("Добавить цветок", "Add a plant"),
        ["water_tooltip"] = ("Полить", "Water"),

        ["status_overdue"] = ("Просрочено на {0}", "{0} overdue"),
        ["status_due_today"] = ("Пора поливать!", "Time to water!"),
        ["status_tomorrow"] = ("Завтра", "Tomorrow"),
        ["status_in_days"] = ("Через {0}", "In {0}"),

        ["confirm_title"] = ("Подтверждение", "Confirm"),
        ["delete_button"] = ("Удалить", "Delete"),
        ["water_button"] = ("Полить", "Water"),
        ["cancel_button"] = ("Отмена", "Cancel"),
        ["delete_confirm_message"] = ("Удалить «{0}» из списка?", "Delete “{0}” from the list?"),
        ["water_early_message"] = ("До полива «{0}» осталось {1}. Полить сейчас?", "{0} isn't due for {1}. Water now?"),

        ["add_title"] = ("Новый цветок", "New plant"),
        ["edit_title"] = ("Редактировать цветок", "Edit plant"),
        ["name_label"] = ("Название", "Name"),
        ["interval_label"] = ("Поливать раз в (дней)", "Water every (days)"),
        ["days_ago_label"] = ("Дней с последнего полива", "Days since last watered"),
        ["save_button"] = ("Сохранить", "Save"),
        ["err_name_required"] = ("Введите название растения.", "Enter a plant name."),
        ["err_interval_invalid"] = ("Интервал должен быть положительным числом дней.", "Interval must be a positive number of days."),
        ["err_days_ago_invalid"] = ("Дней с последнего полива — число 0 или больше.", "Days since last watered must be 0 or greater."),
        ["choose_photo_button"] = ("Выбрать фото", "Choose photo"),
        ["remove_photo_button"] = ("Удалить фото", "Remove photo"),
        ["photo_filter"] = ("Изображения|*.jpg;*.jpeg;*.png;*.bmp;*.webp|Все файлы|*.*", "Image files|*.jpg;*.jpeg;*.png;*.bmp;*.webp|All files|*.*"),

        ["settings_title"] = ("Настройки", "Settings"),
        ["opt_always_on_top"] = ("Отображать поверх всех окон", "Always on top"),
        ["opt_autostart"] = ("Запускать при старте Windows", "Start with Windows"),
        ["opt_allow_resize"] = ("Разрешить изменение размера окна", "Allow window resizing"),
        ["language_label"] = ("Язык", "Language"),
        ["sync_address_label"] = ("Адрес для синхронизации с телефоном", "Address for syncing with your phone"),
        ["sync_address_hint"] = (
            "Введите этот адрес в настройках синхронизации мобильного приложения (оба устройства должны быть в одной Wi-Fi сети).",
            "Enter this address in the mobile app's sync settings (both devices must be on the same Wi-Fi network)."),
        ["sync_address_unknown"] = ("не удалось определить IP", "couldn't detect IP"),
        ["close_button"] = ("Закрыть", "Close"),
        ["version_label"] = ("Версия {0}", "Version {0}"),
    };

    public static void Init(string? savedLanguage)
    {
        _language = savedLanguage ?? "en";
    }

    public static void SetLanguage(string language)
    {
        if (_language == language) return;
        _language = language;
        LanguageChanged?.Invoke();
    }

    public static string T(string key)
    {
        var entry = Table[key];
        return _language == "en" ? entry.en : entry.ru;
    }

    public static string T(string key, params object[] args) => string.Format(T(key), args);

    /// <summary>"5 дн." / "5 days" (or "1 day" in English) — used inside the bigger status phrases.</summary>
    public static string Days(int n) => _language == "en" ? $"{n} day{(n == 1 ? "" : "s")}" : $"{n} дн.";

    public static string StatusOverdue(int daysLate) => T("status_overdue", Days(daysLate));
    public static string StatusInDays(int days) => T("status_in_days", Days(days));
    public static string WaterEarlyMessage(string plantName, int daysLeft) => T("water_early_message", plantName, Days(daysLeft));
    public static string NotifOverdue(string plantName, int daysLate) =>
        _language == "en" ? $"{plantName}: watering overdue by {Days(daysLate)}." : $"{plantName}: просрочен полив на {Days(daysLate)}";
    public static string NotifDue(string plantName) =>
        _language == "en" ? $"{plantName}: time to water!" : $"{plantName}: пора полить!";
}
