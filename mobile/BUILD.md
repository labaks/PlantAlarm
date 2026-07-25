# Сборка Android APK

## Разовая настройка (уже сделана на этом компьютере)

- Android SDK командной строки установлен в `D:\Android` (без полного Android Studio)
- Компоненты: `platform-tools`, `platforms;android-35`, `platforms;android-36`, `build-tools;35.0.0`, `build-tools;36.0.0`, NDK `27.1.12297006` (ставится автоматически при первой сборке)
- `mobile/android/local.properties` → `sdk.dir=D\:\\Android`

## Известные особенности этой машины

1. **GraphQL-запросы Expo CLI не работают** (антивирус/сеть режут ответы) → любые команды `expo`/`eas`, которые ходят в облако, надо запускать с `EXPO_OFFLINE=1` (актуально для `expo start`; для локальной сборки APK не требуется).
2. **Переменная окружения `JDK_JAVA_OPTIONS`** ломает шаг CMake в Gradle (AGP принимает служебную строку `NOTE: Picked up JDK_JAVA_OPTIONS...` за ошибку). Перед сборкой обязательно:
   ```bash
   unset JDK_JAVA_OPTIONS
   unset JDK_JAVAC_OPTIONS
   ```
3. **Установленный Expo Go на телефоне — под SDK 54** (Play Store ещё не раскатил SDK 57 на момент порта), поэтому в `package.json` зафиксирован `expo@54.0.35` и связанные пакеты. Если через какое-то время Expo Go на телефоне обновится, можно попробовать поднять версию через `npx expo install expo@latest` и `npx expo install --fix`.
4. **MIUI/HyperOS (Xiaomi/Redmi/POCO)**: для `adb install` мало включить «Отладку по USB» — отдельно нужно включить **«Установка через USB»** в Настройках для разработчиков, иначе будет `INSTALL_FAILED_USER_RESTRICTED`.

## Релизный keystore (подпись для публикации)

`mobile/android/` целиком в `.gitignore` (генерируется через `expo prebuild`),
поэтому ничего из этого раздела не живёт в git — только на диске конкретной
машины. **Если `android/` когда-нибудь пересоздать заново (`npx expo prebuild
--clean` или просто удалить папку), эту настройку нужно будет повторить.**

- Ключ: `mobile/android/keystore/plantwidget-release.jks` (алиас
  `plantwidget-release`, тип PKCS12 — store- и key-пароль всегда одинаковые).
  Сгенерирован 2026-07-25, действителен до 2053 года.
- Пароли и путь к файлу: `mobile/android/keystore.properties` (не в git).
- `app/build.gradle` при наличии `keystore.properties` в корне `android/`
  подключает эту связку как `signingConfigs.release` и использует её для
  release-сборок; если файла нет — тихо падает обратно на debug-ключ (чтобы
  свежий чекаут без keystore всё равно собирался для локальных тестов).
- **Сам файл keystore и пароли из `keystore.properties` — единственная копия
  в мире.** Обязательно сохранить их отдельно (менеджер паролей / зашифрованное
  облако), вне репозитория и вне этой машины — потеря ключа = невозможность
  выпускать обновления опубликованного в Google Play приложения.

Если настройку нужно воссоздать с нуля (новый ключ — только если старый
безвозвратно потерян и в Google Play ещё ничего не публиковалось; иначе
Play не примет сборку с другим сертификатом):

```bash
mkdir -p mobile/android/keystore
keytool -genkeypair -v \
  -keystore mobile/android/keystore/plantwidget-release.jks \
  -alias plantwidget-release -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass "<пароль>" -dname "CN=..., OU=PlantWidget, O=PlantWidget, L=Unknown, S=Unknown, C=RU"
```

и создать `mobile/android/keystore.properties`:

```properties
storeFile=keystore/plantwidget-release.jks
storePassword=<тот же пароль>
keyAlias=plantwidget-release
keyPassword=<тот же пароль>
```

## AdMob (реклама, PW-018)

Тоже требует ручного повтора, если `android/` пересоздать: в
`mobile/android/build.gradle` (в `allprojects`) стоит
`resolutionStrategy.force 'com.google.android.gms:play-services-ads:25.0.0'`
— без неё сборка падает либо на несовместимости Kotlin-метаданных (версии
25.3.0+), либо на отсутствующем `AdSize.getLargeAnchoredAdaptiveBannerAdSize`
(версии до 25.0.0). Сам App ID и настройки библиотеки — в `mobile/app.json`
под ключом `react-native-google-mobile-ads` (это в git, переживёт
пересоздание `android/`).

Версия npm-пакета `react-native-google-mobile-ads` зафиксирована точно
(`16.3.3`, без `^`) в `package.json` — 16.3.4+ уже требует API, которого нет
в play-services-ads 25.0.0 (см. комментарий в `android/build.gradle`).

## Как пересобрать APK после изменений в коде

```bash
export JAVA_HOME="C:\Program Files\Java\jdk-20"
export ANDROID_HOME="D:\Android"
export ANDROID_SDK_ROOT="D:\Android"
unset JDK_JAVA_OPTIONS
unset JDK_JAVAC_OPTIONS

cd mobile/android
./gradlew.bat assembleRelease
```

APK появится в `mobile/android/app/build/outputs/apk/release/app-release.apk`.

## Установка на телефон

```bash
D:/Android/platform-tools/adb.exe install -r mobile/android/app/build/outputs/apk/release/app-release.apk
```

Debug-сборка (`assembleDebug`) не подходит для автономной работы — она требует запущенный Metro (`npx expo start`) и покажет ошибку "Unable to load script" без него. Для реального использования всегда собирайте `assembleRelease`.
