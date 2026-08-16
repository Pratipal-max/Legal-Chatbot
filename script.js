const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");

// This array acts as the chatbot's memory during the session
let conversationHistory = []; 

userInput.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // 1. Display User Message
    appendMessage(text, "user");
    userInput.value = "";
    
    // 2. Add to Memory (Format required by Gemini API)
    conversationHistory.push({
        role: "user",
        parts: [{ text: text }]
    });

    // 3. Show Loading Indicator
    const loaderId = showLoading();

    try {
        // 4. Send memory to our secure Vercel Serverless Function
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ history: conversationHistory })
        });

        const data = await response.json();
        removeLoading(loaderId);

        if (response.ok) {
            // 5. Display Bot Message & Save to Memory
            appendMessage(data.reply, "bot");
            conversationHistory.push({
                role: "model",
                parts: [{ text: data.reply }]
            });
        } else {
            appendMessage("I apologize, but our systems are currently experiencing a network issue. Please contact the SSLSA Front Office directly.", "bot");
        }
    } catch (error) {
        removeLoading(loaderId);
        appendMessage("An error occurred while connecting to the server.", "bot");
    }
}

function appendMessage(text, sender) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", sender === "user" ? "user-message" : "bot-message");

    const icon = sender === "user" ? '<i class="fas fa-user"></i>' : '<i class="fas fa-scale-balanced"></i>';
    
    // Basic Markdown support for bolding and line breaks
    let formattedText = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

    msgDiv.innerHTML = `
        <div class="avatar">${icon}</div>
        <div class="text">${formattedText}</div>
    `;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function showLoading() {
    const loaderId = 'loader-' + Date.now();
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", "bot-message");
    msgDiv.id = loaderId;
    msgDiv.innerHTML = `
        <div class="avatar"><i class="fas fa-scale-balanced"></i></div>
        <div class="text">
            <div class="loading-dots"><span></span><span></span><span></span></div>
        </div>
    `;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return loaderId;
}

function removeLoading(loaderId) {
    const loader = document.getElementById(loaderId);
    if (loader) loader.remove();
}