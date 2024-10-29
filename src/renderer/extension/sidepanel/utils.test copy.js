// src/sidepanel/utils.test.js
const { convertHistoryToString, replaceInfluencerNameInString, replaceStringWithInfluencerName } = require("./utils");

describe("convertHistoryToString", () => {
  it("should convert history to string correctly", () => {
    const history = [
      {
        role: "user",
        content: "thanks\n"
      },
      {
        role: "user",
        content: "<image>"
      },
      {
        role: "user",
        content: "<image>"
      },
      {
        role: "user",
        content: "hi\n"
      },
      {
        role: "user",
        content: "<image, image>"
      },
      {
        role: "user",
        content: "Test message\n"
      },
      {
        role: "influencer",
        content: "want it?\n"
      },
      {
        role: "influencer",
        content: "hey\n"
      }
    ];
    const model = "LagrandAI";
    const usernames = ["user"];
    const maxSentences = 2;

    const result = convertHistoryToString(
      history,
      model,
      usernames,
      maxSentences
    );
    const expected =
      "usr: thanks. <image> <image> hi. <image, image> Test message.\nLAGRAND: want it? hey.";

    expect(result).toBe(expected);
  });

  it("should replace usernames with [usr]", () => {
    const history = [
      { role: "user", content: "Hello, Alex! How are you?" },
      {
        role: "influencer",
        content: "I am fine, user! How can I help you today?"
      }
    ];
    const model = "LagrandAI";
    const usernames = ["Alex"];

    const result = convertHistoryToString(history, model, usernames);
    const expected =
      "usr: Hello, [usr]! How are you?\nLAGRAND: I am fine, [usr]! How can I help you today?";

    expect(result).toBe(expected);
  });
  it("should not replace parts of contractions with [usr]", () => {
    const history = [
      { role: "user", content: "I don't want to be replaced." },
      { role: "influencer", content: "You won't be replaced." }
    ];
    const model = "LagrandAI";
    const usernames = ["T"];

    const result = convertHistoryToString(history, model, usernames);
    const expected =
      "usr: I don't want to be replaced.\nLAGRAND: You won't be replaced.";

    expect(result).toBe(expected);
  });
  it("should add 'usr: <blank>' if the first item in history is not from user", () => {
    const history = [
      { role: "influencer", content: "Hello, how can I assist you today?" },
      { role: "user", content: "I need help with my account " }
    ];
    const model = "LagrandAI";
    const usernames = ["user"];

    const result = convertHistoryToString(history, model, usernames);
    const expected =
      "usr: <blank>\nLAGRAND: Hello, how can I assist you today?\nusr: I need help with my account.";

    expect(result).toBe(expected);
  });

  it("should add 'usr: <blank>' if the first item in history is not from user", () => {
    const history = [
      { role: "influencer", content: "Hello John Doe, how can I assist you today?" },
      { role: "user", content: "I need help with my account " },
      { role: "influencer", content: "John, How are you doing?" },
    ];
    const model = "LagrandAI";
    const usernames = ["John Doe"];

    const result = convertHistoryToString(history, model, usernames);
    const expected =
      "usr: <blank>\nLAGRAND: Hello [usr], how can I assist you today?\nusr: I need help with my account.\nLAGRAND: [usr], How are you doing?";

    expect(result).toBe(expected);
  });

  it("should correctly format a message with emojis and special characters", () => {
    const history = [
      { role: "influencer", content: "Woooooooow 😲😲 Thank you for coming to my page, honey! It's so good to see you here 😘 Tell me where are you from? Also I wanna say that you won't be bored with me, I'll win your heart😏 You can unlock that bundle and see whats hidden there🤭 How are you doing and in the mood after you see it?" }
    ];
    const model = "LagrandAI";
    const usernames = [""];

    const result = convertHistoryToString(history, model, usernames);
    const expected =
      "usr: <blank>\nLAGRAND: Woooooooow 😲😲 Thank you for coming to my page, honey! It's so good to see you here 😘 Tell me where are you from? Also I wanna say that you won't be bored with me, I'll win your heart😏 You can unlock that bundle and see whats hidden there🤭 How are you doing and in the mood after you see it?";

    expect(result).toBe(expected);
  });

  it("should replace all variations of the model name with the given name", () => {
    const modelName = "Jane";
    const names = ["Gemma", "Gemma Massey", "Gem", "Massey"];
    const inputString = "Hi Gemma Massey, how are you? Gemma Massey is here. Miss Massey is present. Gem is short for Gemma.";
    const expectedOutput = "Hi Jane, how are you? Jane is here. Miss Jane is present. Jane is short for Jane.";

    const result = replaceInfluencerNameInString(modelName, names, inputString);

    expect(result).toBe(expectedOutput);
  });

  it("should not replace any part of the string if no variations of the model name are found", () => {
    const modelName = "Jane";
    const names = ["Gemma", "Gemma Massey", "Gem", "Massey"];
    const inputString = "Hi JANE, how are you? Jane is here. Miss Jane is present. Jane is short for Jane.";
    const expectedOutput = "Hi Gemma, how are you? Gemma is here. Miss Gemma is present. Gemma is short for Gemma.";

    const result = replaceStringWithInfluencerName(modelName, names, inputString);

    expect(result).toBe(expectedOutput);
  });

it("should convert history to string correctly with real names", () => {
  const history = [
      { role: "influencer", content: "Hello John, how are you?" },
      { role: "user", content: "I need help with my account Jane" },
      { role: "influencer", content: "John and Jane are friends." },
    ];
    const model = "LagrandAI";
    const usernames = ["[n1, n2]"];

    expect(() => convertHistoryToString(history, model, usernames)).not.toThrow();
  });
});
