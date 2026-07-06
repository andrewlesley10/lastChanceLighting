<?php
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: contact.html');
    exit;
}

$firstName = trim($_POST['firstName'] ?? '');
$lastName = trim($_POST['lastName'] ?? '');
$email = trim($_POST['email'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$projectType = trim($_POST['projectType'] ?? '');
$message = trim($_POST['message'] ?? '');

$errors = [];

if ($firstName === '') {
    $errors[] = 'First name is required.';
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'A valid email address is required.';
}

if ($projectType === '') {
    $errors[] = 'Project type is required.';
}

if ($message === '') {
    $errors[] = 'Your message is required.';
}

if (!empty($errors)) {
    $query = http_build_query([
        'status' => 'error',
        'message' => implode(' ', $errors),
    ]);
    header('Location: contact.html?' . $query);
    exit;
}

$to = 'info@lastchancelighting.lk';
$subject = 'New contact form submission from ' . htmlspecialchars($firstName, ENT_QUOTES, 'UTF-8');

$body = "First Name: $firstName\n";
if ($lastName !== '') {
    $body .= "Last Name: $lastName\n";
}
$body .= "Email: $email\n";
if ($phone !== '') {
    $body .= "Phone: $phone\n";
}
$body .= "Project Type: $projectType\n\n";
$body .= "Message:\n$message\n";

$headers = [];
$headers[] = 'From: no-reply@lastchancelighting.lk';
$headers[] = 'Reply-To: ' . $email;
$headers[] = 'Content-Type: text/plain; charset=UTF-8';

$sent = mail($to, $subject, $body, implode("\r\n", $headers));

if ($sent) {
    header('Location: contact.html?status=success');
    exit;
}

$query = http_build_query([
    'status' => 'error',
    'message' => 'Your message could not be sent right now. Please try again later.',
]);
header('Location: contact.html?' . $query);
exit;
