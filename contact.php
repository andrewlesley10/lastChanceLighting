<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get and clean form values
    $name    = trim($_POST['name'] ?? '');
    $email   = trim($_POST['email'] ?? '');
    $phone   = trim($_POST['phone'] ?? '');
    $message = trim($_POST['message'] ?? '');

    // Basic validation (server-side)
    if ($name === '' || $email === '' || $phone === '' || $message === '') {
        http_response_code(400);
        echo "Missing required fields.";
        exit;
    }

    // Send to both addresses
    $to = "info@orthosports.lk, piremsanth@orthosports.lk, kamalakanth@orthosports.lk";

    $subject = "New contact form message from $name";

    $body  = "You have received a new message from the contact form on orthosports.lk.\n\n";
    $body .= "Name:  $name\n";
    $body .= "Email: $email\n";
    $body .= "Phone: $phone\n\n";
    $body .= "Message:\n$message\n";

    // Email headers
    $headers  = "From: Orthosports Website <info@orthosports.lk>\r\n";
    $headers .= "Reply-To: $email\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

    if (mail($to, $subject, $body, $headers)) {
        // Simple success page (for normal form submit)
        echo "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Thank You</title>";
        echo "<meta name='viewport' content='width=device-width, initial-scale=1.0'></head><body>";
        echo "<h2>Thank you for your message!</h2>";
        echo "<p>We have received your enquiry and will get back to you soon.</p>";
        echo "<p><a href='/'>Back to home page</a></p>";
        echo "</body></html>";
    } else {
        http_response_code(500);
        echo "Sorry, we could not send your message. Please try again later.";
    }
} else {
    http_response_code(405);
    echo "Method not allowed.";
}
