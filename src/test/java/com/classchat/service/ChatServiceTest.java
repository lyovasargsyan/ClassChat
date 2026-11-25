package com.classchat.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.classchat.dto.ChatMessage;
import com.classchat.dto.ChatRequest;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for ChatService. No Spring and no WebSocket here: ChatService is a normal Java class,
 * so we just create it with "new". We give it a FIXED clock, so the time in the test never changes.
 */
class ChatServiceTest {

    private static final Instant NOW = Instant.parse("2026-01-15T10:00:00Z");

    private final ChatService chatService = new ChatService(Clock.fixed(NOW, ZoneOffset.UTC));

    // This first test is an example. It passes in the starter.
    @Test
    void validMessageKeepsSenderAndContent() {
        ChatMessage result = chatService.process(new ChatRequest("Ana", "Hello!"));

        assertEquals("Ana", result.sender());
        assertEquals("Hello!", result.content());
    }

    // TODO 5: Write your own tests here. Aim for these (one @Test method for each, with a clear name):
    //
    //   VALID messages
    //     - the result gets the timestamp of the clock (NOW). It fails until TODO 3 is done.
    //     - a nickname with exactly 30 characters is accepted        (use "a".repeat(30))
    //     - a message with exactly 500 characters is accepted
    //
    //   INVALID messages (use assertThrows(InvalidMessageException.class, () -> ...))
    //     - blank nickname: "", "   " and null
    //     - blank message:  "", "   " and null
    //     - nickname with 31 characters
    //     - message with 501 characters
    //
    //   Bonus: check the text of the exception with assertEquals(..., exception.getMessage()).
    //   Run them with:  ./mvnw test
    //   Tests of invalid messages fail until TODO 2 is done: that is normal. Write the test first, then the code.

    @Test
    void validMessageGetsTimestampOfTheClock() {
        ChatMessage result = chatService.process(new ChatRequest("Ana", "Hello!"));

        assertEquals(NOW, result.timestamp());
    }

    @Test
    void nicknameWithExactly30CharactersIsAccepted() {
        String nickname = "a".repeat(30);

        ChatMessage result = chatService.process(new ChatRequest(nickname, "Hello!"));

        assertEquals(nickname, result.sender());
    }

    @Test
    void messageWithExactly500CharactersIsAccepted() {
        String content = "a".repeat(500);

        ChatMessage result = chatService.process(new ChatRequest("Ana", content));

        assertEquals(content, result.content());
    }



    @Test
    void blankNicknameIsRejected() {
        assertThrows(InvalidMessageException.class,
                () -> chatService.process(new ChatRequest("", "Hello!")));
        assertThrows(InvalidMessageException.class,
                () -> chatService.process(new ChatRequest("   ", "Hello!")));
        assertThrows(InvalidMessageException.class,
                () -> chatService.process(new ChatRequest(null, "Hello!")));
    }

    @Test
    void blankMessageIsRejected() {
        assertThrows(InvalidMessageException.class,
                () -> chatService.process(new ChatRequest("Ana", "")));
        assertThrows(InvalidMessageException.class,
                () -> chatService.process(new ChatRequest("Ana", "   ")));
        assertThrows(InvalidMessageException.class,
                () -> chatService.process(new ChatRequest("Ana", null)));
    }

    @Test
    void nicknameWith31CharactersIsRejected() {
        String nickname = "a".repeat(31);

        assertThrows(InvalidMessageException.class,
                () -> chatService.process(new ChatRequest(nickname, "Hello!")));
    }

    @Test
    void messageWith501CharactersIsRejected() {
        String content = "a".repeat(501);

        assertThrows(InvalidMessageException.class,
                () -> chatService.process(new ChatRequest("Ana", content)));
    }

}
