<?php
/**
 * update_score.php
 * ไฟล์รับข้อมูลคะแนนด้วย AJAX (Fetch API) ทางช่องทาง POST เพื่อเปรียบเทียบและอัปเดตคะแนนสูงสุด (High Score) ในฐานข้อมูล
 */

header('Content-Type: application/json; charset=utf-8');
session_start();

// นำเข้าไฟล์เชื่อมต่อฐานข้อมูล
require_once 'db.php';

// ตรวจสอบความถูกต้องของการล็อกอิน
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'status' => 'error',
        'message' => 'กรุณาล็อกอินก่อนทำการบันทึกคะแนน!'
    ]);
    exit();
}

$user_id = $_SESSION['user_id'];

// รับข้อมูลที่ส่งมาจาก Fetch API (ซึ่งจะส่งในรูปแบบ JSON)
$input_data = file_get_contents('php://input');
$data = json_decode($input_data, true);

// หากไม่ได้รับแบบ JSON ให้ลองดึงจาก $_POST
$new_score = isset($data['score']) ? intval($data['score']) : (isset($_POST['score']) ? intval($_POST['score']) : null);

if ($new_score === null || $new_score < 0) {
    echo json_encode([
        'status' => 'error',
        'message' => 'คะแนนที่ส่งมาไม่ถูกต้อง!'
    ]);
    exit();
}

try {
    // 1. ดึงคะแนนสูงสุดเดิมของผู้เล่นออกมาเพื่อเปรียบเทียบ
    $stmt = $pdo->prepare("SELECT high_score FROM users WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $user_id]);
    $user = $stmt->fetch();

    if (!$user) {
        echo json_encode([
            'status' => 'error',
            'message' => 'ไม่พบข้อมูลผู้เล่นในระบบ!'
        ]);
        exit();
    }

    $current_high_score = intval($user['high_score']);
    $is_new_record = false;

    // 2. ถ้าคะแนนใหม่สูงกว่าคะแนนสะสมเดิม ให้ทำการอัปเดตลงฐานข้อมูล
    if ($new_score > $current_high_score) {
        $updateStmt = $pdo->prepare("UPDATE users SET high_score = :new_score WHERE id = :id");
        $updateStmt->execute([
            'new_score' => $new_score,
            'id' => $user_id
        ]);
        $current_high_score = $new_score;
        $is_new_record = true;
    }

    // 3. ส่งข้อมูลกลับไปยังตัวเกมทางฝั่ง JavaScript
    echo json_encode([
        'status' => 'success',
        'message' => $is_new_record ? 'บันทึกคะแนนสถิติใหม่สำเร็จ!' : 'บันทึกคะแนนเรียบร้อยแล้ว (ไม่ทำลายสถิติเดิม)',
        'high_score' => $current_high_score,
        'new_record' => $is_new_record
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'เกิดความผิดพลาดในระบบฐานข้อมูล: ' . $e->getMessage()
    ]);
}
?>
