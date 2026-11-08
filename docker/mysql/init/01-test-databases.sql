-- Lo corre la imagen de MySQL solo la primera vez que arranca, con el volumen vacío.
-- MYSQL_USER solo recibe permisos sobre MYSQL_DATABASE (la base de desarrollo). Los tests usan
-- gastoclaro_test y, en paralelo, gastoclaro_test-0, gastoclaro_test-1, ...: el patrón los cubre.
CREATE DATABASE IF NOT EXISTS gastoclaro_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON `gastoclaro\_test%`.* TO 'gastoclaro'@'%';
FLUSH PRIVILEGES;
