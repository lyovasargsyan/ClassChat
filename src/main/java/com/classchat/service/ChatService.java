package com.classchat.service;

import com.classchat.dto.ChatMessage;
import com.classchat.dto.ChatRequest;
import java.time.Clock;
import java.time.Instant;
import org.springframework.stereotype.Service;

/**
 * The business rules of the chat: check a message and turn it into what everybody will see.
 * It knows nothing about WebSocket, so you can test it like any normal Java class.
 */
@Service
public class ChatService {

    public static final int MAX_NICKNAME_LENGTH = 30;
    public static final int MAX_MESSAGE_LENGTH = 500;

    // The clock is injected (not hidden inside the code), so a test can use a fixed time.
    // Its bean is defined in config/ClockConfig.java
    private final Clock clock;

    public ChatService(Clock clock) {
        this.clock = clock;
    }

    /**
     * Checks the request and creates the message that will be broadcast to all users.
     *
     * @throws InvalidMessageException if the request breaks a rule (see TODO 2)
     */
    public ChatMessage process(ChatRequest request) {
        validate(request);

        // TODO 3: The starter sends NO time (null), so the browser shows "--:--:--".
        //         Create the timestamp HERE, on the server: use the injected clock (clock.instant()).
        //         Do not trust a time from the browser.
        Instant timestamp = clock.instant();

        return new ChatMessage(request.sender(), request.content(), timestamp);
    }

    private void validate(ChatRequest request) {
        // TODO 2: The starter accepts EVERYTHING, even empty messages. Reject a request by throwing
        //         new InvalidMessageException("a helpful text for the user") when:
        //           - the nickname (request.sender()) is null or blank,
        //           - the nickname is longer than MAX_NICKNAME_LENGTH (30) characters,
        //           - the message (request.content()) is null or blank,
        //           - the message is longer than MAX_MESSAGE_LENGTH (500) characters.
        //         Hints: String.isBlank(); remember that a field can be null.
        //         The controller already sends your exception text to the user who made the mistake.
        if(request.sender() == null || request.sender().isBlank()){
            throw new InvalidMessageException("Nickname is null or blank.");
        }
        if(request.sender().length() > MAX_NICKNAME_LENGTH){
            throw new InvalidMessageException("Nickname must be shorter than 30 chars.");
        }
        if(request.content() == null || request.content().isBlank()){
            throw new InvalidMessageException("Message content is null or blank.");
        }
        if(request.content().length() > MAX_MESSAGE_LENGTH){
            throw new InvalidMessageException("Message must be shorter than 500 chars.");
        }
    }
}
