# UF Elforun

![Go](https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![LibreOffice](https://img.shields.io/badge/LibreOffice-008000?style=for-the-badge&logo=libreoffice&logoColor=white)
![Nix](https://img.shields.io/badge/Nix-5277C3?style=for-the-badge&logo=nixos&logoColor=white)

Веб-сервис для пакетной конвертации лабораторных RTF-отчетов из проприетарноо ПО elforun.

- **Конвертация RTF в PDF** с использованием локального безголового (headless) LibreOffice в едином контейнере.
- **Исправление кодировок (кириллицы)** - замена деклараций `\ansicpg0` на `\ansicpg1251` и дефолтных шрифтов на `\fcharset204` для предотвращения ошибок с кодировой.
- **Нативное извлечение графиков**:
  - Чтение сырых байт RTF и извлечение встроенных WMF-изображений без внешних библиотек.
  - Рендеринг WMF в PNG средствами LibreOffice.

## Структура проекта

```
.
├── cmd/
│   └── server/
│       ├── main.go
│       ├── handlers.go 
│       └── extractor.go
├── public/
│   ├── index.html
│   └── logo.png
├── samples/
├── Dockerfile
├── docker-compose.yml
├── flake.nix / flake.lock
└── go.mod
```

## Запуск проекта

### Использование Docker (Рекомендуется)

Для сборки образа и запуска контейнера выполните из корня проекта:

```bash
docker compose up --build -d
```

После этого веб-интерфейс будет доступен по адресу: [http://localhost:8080](http://localhost:8080).

### Локальная разработка (с Nix)

Если у вас установлен Nix, вы можете войти во временное окружение с установленным Go:

```bash
nix develop
```

Затем запустите сервер:

```bash
go run ./cmd/server
```

*Примечание: для полноценной конвертации на хост-системе должен быть установлен `libreoffice`.*

## REST API

- **POST `/upload`** — загрузка файла RTF. Принимает `multipart/form-data` с ключом `file`. Возвращает JSON вида:
  ```json
  {
    "id": "transaction-uuid",
    "pdfName": "report.pdf",
    "pngName": "chromatogram.png"
  }
  ```
- **GET `/download/{uuid}/report.pdf`** — скачивание сгенерированного PDF отчета.
- **GET `/download/{uuid}/chromatogram.png`** — скачивание вырезанного графика хроматограммы.
