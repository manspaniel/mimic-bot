import React, { useState, useEffect } from "react";
import { Box, render, Static, Text } from "ink";
import TextInput from "ink-text-input";
import { getBotInfo } from "./config.js";
import { ChatSession } from "./chat-model.js";

type Props = {
  session: ChatSession;
};

function Chat({ session }: Props) {
  const [buffer, setBuffer] = useState("");
  const [updateID, setUpdateID] = useState(0);

  useEffect(() => {
    return session.subscribe(() => {
      setUpdateID((i) => i + 1);
    });
  }, []);

  return (
    <>
      <Static
        items={session.messages.filter((item) => !item.loading)}
        style={{ width: "100%" }}
      >
        {(message) => (
          <Box
            key={message.id}
            borderStyle="round"
            paddingX={1}
            paddingY={0}
            width="100%"
            borderColor={
              message.role === "assistant" ? "greenBright" : "magentaBright"
            }
          >
            <Text>
              {message.role === "assistant" ? "🤖 " : "💬 "}
              {message.text}
              {message.loading ? "..." : ""}
            </Text>
          </Box>
        )}
      </Static>
      {session.messages
        .filter((item) => item.loading)
        .map((message) => (
          <Box
            key={message.id}
            borderStyle="round"
            paddingX={1}
            paddingY={0}
            width="100%"
            borderColor={"greenBright"}
          >
            <Text>
              {"🤖 "}
              {message.text}
              ...
            </Text>
          </Box>
        ))}
      <Box
        borderStyle="round"
        paddingX={1}
        paddingY={0}
        width="100%"
        borderColor="magenta"
      >
        <Text>&gt; </Text>
        <TextInput
          value={buffer}
          onChange={setBuffer}
          placeholder="Enter a message"
          onSubmit={(value) => {
            setBuffer("");
            session.sendMessage(value);
          }}
        />
      </Box>
    </>
  );
}

export async function beginChat(name: string) {
  const info = await getBotInfo(name);
  const session = new ChatSession(info);
  await session.init();
  render(<Chat session={session} />);
}
