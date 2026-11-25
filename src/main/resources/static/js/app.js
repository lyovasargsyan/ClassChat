"use strict";

/*
 * The browser side of ClassChat. It is finished for you: you do not need to change it,
 * except TODO 4 (the character counter).
 *
 * The message flow, in short:
 *   1. connect()      opens a WebSocket to /ws and speaks STOMP (CONNECT frame).
 *   2. onConnect      subscribes to "/topic/messages" (everybody's messages)
 *                     and to "/user/queue/errors" (errors only for me).
 *   3. sendMessage()  publishes JSON to "/app/chat.send"  ->  Java: ChatController.send(...)
 *   4. The server broadcasts the result to "/topic/messages" -> addMessage() draws it.
 */

// ---------- Settings (they must match the Java side) ----------
const MAX_MESSAGE_LENGTH = 500;                 // the same rule as ChatService.MAX_MESSAGE_LENGTH
const SEND_DESTINATION = "/app/chat.send";      // ChatController @MessageMapping("/chat.send") + prefix /app
const MESSAGES_TOPIC = "/topic/messages";       // ChatController @SendTo("/topic/messages")
const ERRORS_QUEUE = "/user/queue/errors";      // ChatController @SendToUser("/queue/errors")

// ---------- Page elements ----------
const els = {
    status: document.getElementById("status"),
    connectForm: document.getElementById("connect-form"),
    nickname: document.getElementById("nickname"),
    connectBtn: document.getElementById("connect-btn"),
    disconnectBtn: document.getElementById("disconnect-btn"),
    error: document.getElementById("error"),
    messages: document.getElementById("messages"),
    emptyHint: document.getElementById("empty-hint"),
    messageForm: document.getElementById("message-form"),
    messageInput: document.getElementById("message-input"),
    sendBtn: document.getElementById("send-btn"),
    counter: document.getElementById("char-counter"),
};

// ---------- State ----------
let stompClient = null;
let nickname = "";
let wasConnected = false;
let disconnectedByUser = false;

// ws:// for http pages, wss:// for https pages. Same host and port as the page itself (same origin).
function webSocketUrl() {
    const scheme = window.location.protocol === "https:" ? "wss:" : "ws:";
    return scheme + "//" + window.location.host + "/ws";
}

// ---------- Connect / disconnect ----------
function connect(event) {
    event.preventDefault();
    if (stompClient) {
        return;                                   // already connecting or connected
    }
    nickname = els.nickname.value;                // sent as typed: the SERVER decides if it is valid
    wasConnected = false;
    disconnectedByUser = false;
    hideError();
    setStatus("connecting");

    stompClient = new StompJs.Client({
        brokerURL: webSocketUrl(),
        reconnectDelay: 0,                        // no automatic reconnect: keep it simple
        onConnect: onConnected,
        onStompError: (frame) => showError("Server error: " + (frame.headers["message"] || "unknown error")),
        onWebSocketError: () => showError("Cannot reach the chat server. Check that it is running, then try again."),
        onWebSocketClose: onClosed,
    });
    stompClient.activate();
}

function onConnected() {
    wasConnected = true;
    stompClient.subscribe(MESSAGES_TOPIC, (frame) => addMessage(JSON.parse(frame.body)));
    stompClient.subscribe(ERRORS_QUEUE, (frame) => showError(JSON.parse(frame.body).message));
    setStatus("connected");
    els.messageInput.focus();
}

function onClosed() {
    if (wasConnected && !disconnectedByUser) {
        showError("Connection lost. Press Connect to join again.");
    }
    if (stompClient) {
        stompClient.deactivate();
        stompClient = null;
    }
    setStatus("disconnected");
}

function disconnect() {
    disconnectedByUser = true;
    if (stompClient) {
        stompClient.deactivate();                 // sends DISCONNECT and closes the WebSocket
    }
}

// ---------- Sending ----------
function sendMessage(event) {
    event.preventDefault();
    if (!stompClient || !stompClient.connected) {
        showError("You are not connected.");
        return;
    }
    hideError();
    // The browser sends only the nickname and the text. The time is added by the server.
    stompClient.publish({
        destination: SEND_DESTINATION,
        body: JSON.stringify({ sender: nickname, content: els.messageInput.value }),
    });
    els.messageInput.value = "";
    updateCounter();
    els.messageInput.focus();
}

// TODO 4: Add a character counter for the message box.
//   1. Make updateCounter() write text like "12 / 500" into els.counter (use els.messageInput.value.length
//      and MAX_MESSAGE_LENGTH).
//   2. When the text is longer than MAX_MESSAGE_LENGTH, add the CSS class "counter--over" to els.counter
//      (it makes the number red). Remove the class again when the text is short enough.
//   3. Call it every time the user types: add a listener for the "input" event of els.messageInput.
//      It is also already called after a message is sent, to reset the counter.
function updateCounter() {
    const length = els.messageInput.value.length;
    els.counter.textContent = length + " / " + MAX_MESSAGE_LENGTH;
    els.counter.classList.toggle("counter--over", length > MAX_MESSAGE_LENGTH);
}

// ---------- Showing messages (always as TEXT, never as HTML) ----------
function addMessage(message) {
    // textContent puts the text on the page as plain text. If somebody sends "<b>hi</b>" or a <script>
    // tag, everybody just sees those characters. Never use innerHTML for text from other users!
    const box = document.createElement("div");
    box.className = "message" + (message.sender === nickname ? " message--own" : "");

    const meta = document.createElement("div");
    meta.className = "message-meta";
    const sender = document.createElement("span");
    sender.className = "message-sender";
    sender.textContent = message.sender;
    const time = document.createElement("time");
    time.textContent = formatTime(message.timestamp);
    meta.append(sender, time);

    const text = document.createElement("p");
    text.className = "message-text";
    text.textContent = message.content;

    box.append(meta, text);

    const nearBottom = els.messages.scrollHeight - els.messages.scrollTop - els.messages.clientHeight < 80;
    if (els.emptyHint) {
        els.emptyHint.remove();
        els.emptyHint = null;
    }
    els.messages.append(box);
    if (nearBottom || message.sender === nickname) {
        els.messages.scrollTop = els.messages.scrollHeight;
    }
}

function formatTime(timestamp) {
    if (!timestamp) {
        return "--:--:--";                        // the server did not send a time (the starter)
    }
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? "--:--:--" : date.toLocaleTimeString();
}

// ---------- Status and errors ----------
function setStatus(state) {
    const labels = {
        disconnected: "Disconnected",
        connecting: "Connecting...",
        connected: "Connected",
    };
    els.status.textContent = labels[state];
    els.status.className = "status status--" + state;

    const connected = state === "connected";
    const idle = state === "disconnected";
    els.nickname.disabled = !idle;
    els.connectBtn.disabled = !idle;
    els.disconnectBtn.disabled = !connected;
    els.messageInput.disabled = !connected;       // no sending while disconnected
    els.sendBtn.disabled = !connected;
}

function showError(text) {
    els.error.textContent = text;
    els.error.hidden = false;
}

function hideError() {
    els.error.hidden = true;
    els.error.textContent = "";
}

// ---------- Wire the page ----------
els.connectForm.addEventListener("submit", connect);
els.disconnectBtn.addEventListener("click", disconnect);
els.messageForm.addEventListener("submit", sendMessage);
els.messageInput.addEventListener("input", updateCounter);
setStatus("disconnected");
updateCounter();
