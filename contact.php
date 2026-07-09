<?php
declare(strict_types=1);

function is_ajax_request(): bool
{
    $xhr = $_SERVER['HTTP_X_REQUESTED_WITH'] ?? '';
    $accept = $_SERVER['HTTP_ACCEPT'] ?? '';

    return strcasecmp($xhr, 'XMLHttpRequest') === 0
        || str_contains($accept, 'application/json');
}

function respond(bool $success, string $message, int $code = 200): void
{
    if (is_ajax_request()) {
        http_response_code($code);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode([
            'success' => $success,
            'message' => $message,
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $query = http_build_query([
        'status' => $success ? 'success' : 'error',
        'message' => $message,
    ]);
    header('Location: contact?' . $query);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    if (is_ajax_request()) {
        respond(false, 'Invalid request method.', 405);
    }
    header('Location: contact');
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
    respond(false, implode(' ', $errors), 422);
}

$to = 'info@lastchancelighting.lk';
$subject = 'New contact form submission from ' . $firstName;

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

$sent = @mail($to, $subject, $body, implode("\r\n", $headers));

if ($sent) {
    respond(true, 'Thank you! Your message has been sent successfully.');
}

respond(
    false,
    'Your message could not be sent right now. Please try again later or email us at info@lastchancelighting.lk.',
    500
);
