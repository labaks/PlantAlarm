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
