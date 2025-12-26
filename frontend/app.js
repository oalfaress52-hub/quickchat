const form = document.getElementById('chat-form');
const input = document.getElementById('message-input');
const messagesDiv = document.getElementById('messages');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const msg = input.value.trim();
  if (msg === '') return;

  // Display message in chat
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message');
  msgDiv.textContent = msg;
  messagesDiv.appendChild(msgDiv);

  // Scroll to bottom
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  // Clear input
  input.value = '';
});
