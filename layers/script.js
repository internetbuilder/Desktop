function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const chatMessages = document.getElementById('chat-messages');

    const messageText = messageInput.value;
    if (messageText.trim() === '') {
        return;
    }

    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.textContent = messageText;

    chatMessages.appendChild(messageElement);

    // Clear the input field after sending the message
    messageInput.value = '';
}