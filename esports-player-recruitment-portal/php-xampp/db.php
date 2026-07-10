<?php
/**
 * db.php
 * ไฟล์เชื่อมต่อฐานข้อมูล MySQL ด้วย PDO และรองรับการสร้างฐานข้อมูล/ตารางอัตโนมัติเพื่อความสะดวกใน XAMPP
 */

$host = 'localhost';
$db_user = 'root'; // ค่าเริ่มต้นของ XAMPP
$db_pass = '';     // ค่าเริ่มต้นของ XAMPP (ว่างเปล่า)
$db_name = 'esports_db';

try {
    // 1. เชื่อมต่อกับ MySQL (ยังไม่ระบุชื่อฐานข้อมูล เพื่อทำการตรวจสอบและสร้างใหม่หากไม่มี)
    $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // 2. สร้างฐานข้อมูลหากยังไม่มี
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$db_name` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    
    // 3. เลือกใช้งานฐานข้อมูลที่กำหนด
    $pdo->exec("USE `$db_name`");

    // 4. สร้างตาราง users หากยังไม่มี
    $createTableQuery = "
        CREATE TABLE IF NOT EXISTS `users` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `username` VARCHAR(50) NOT NULL UNIQUE,
            `password` VARCHAR(255) NOT NULL,
            `full_name` VARCHAR(100) NOT NULL,
            `email` VARCHAR(100) NOT NULL,
            `high_score` INT DEFAULT 0,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    $pdo->exec($createTableQuery);

} catch (PDOException $e) {
    // หากเชื่อมต่อล้มเหลว ให้แสดงข้อความผิดพลาด
    die("เชื่อมต่อฐานข้อมูลล้มเหลว: " . $e->getMessage());
}
?>
