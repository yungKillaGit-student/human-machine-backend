# Human-machine backend

Добавил аутентификацию, контроллер для работы с юзерами, покрыл тестами

## Запуск

```bash
npm install
```
Скопировать файлы и переименовать:  
.env.sample -> .env  
config/config.sample.json -> config/config-local.json  
config/datasources/postgres.sample.json -> config/datasources/postgres-local.json  
  
Далее нужно настроить под себя конфиг для соединения с бд.

Для запуска введите следующую команду: 
```bash
npm run start:dev
```

## Тесты

```bash
npm run migrations:test
npm run test
```
