const { readHTMLFile, emulateHTML } = require("./test-utils");
const { parsePayments } = require("./only_fans_parser");

function expectPaymentsToEqualIgnoringContent(
  actualPayments,
  expectedPayments
) {
  const filterContent = (payment) => {
    const { content, ...rest } = payment;
    return rest;
  };

  const filteredActualPayments = actualPayments.map(filterContent);
  const filteredExpectedPayments = expectedPayments.map(filterContent);

  expect(filteredActualPayments).toEqual(filteredExpectedPayments);
}

describe("parsePayments", () => {
  it("should parse payments correctly from the provided HTML", () => {
    const htmlString = readHTMLFile("./test_html/payment-test.html");
    const document = emulateHTML(htmlString);
    const payments = parsePayments(document);
    expectPaymentsToEqualIgnoringContent(payments, [
      // {
      //   id: "",
      //   price: 5,
      //   time: "2023-06-11T10:45:00.000Z",
      //   status: "Not Read",
      //   paidStatus: "Paid",
      //   imageUrl: null,
      //   mediaTypes: [],
      //   type: "tip",
      //   vaultName: "Unknown",
      //   content:
      //     "I sent you a $5.00 tip Hi Legrand! Have been a fan of you and the guys on your many sites over the past years. Thanks for giving me so much fun and a frequent cure for my horniness. Being older I particularly like your pairing of older with younger guys since it plays into many of my fantasies. You do it a hot but professional way and the chemistry between you and your models makes for some hot male action."
      // },
      // {
      //   id: "",
      //   price: 5,
      //   time: "2024-01-19T16:20:00.000Z",
      //   status: "Not Read",
      //   paidStatus: "Paid",
      //   imageUrl:
      //     "./Messages — OnlyFans_files/5856_138700941659_6642246_n(1).jpg",
      //   mediaTypes: [],
      //   type: "tip",
      //   vaultName: "Unknown",
      //   content:
      //     "I sent you a $5.00 tip  under this postThanks Legrand for all your posts!\n" +
      //     " 8:20 pm"
      // },
      {
        id: "",
        price: 130,
        time: "2024-04-25T06:45:00.000Z",
        status: "Read",
        paidStatus: "Not Paid",
        imageUrl:
          "./Messages — OnlyFans_files/960x503_e767a261afbc47e0d823f8d8454d0e85.jpg",
        mediaTypes: ["image", "video"],
        type: "purchase",
        vaultName: "Unknown",
        content:
          "Play Video TagsReece ScottI know you like seeing Daddy dominate his submissive twinks. But what if I dominate someone who's also very dominant in bed? Watch how I filled his ass and hear how I made Reece Scott moan with my monstrous cock. NEW and EXCLUSIVE!\n" +
          " 9:45 am  $130 not paid yet"
      },
      {
        id: "",
        price: 40,
        time: "2024-05-15T15:12:00.000Z",
        status: "Read",
        paidStatus: "Not Paid",
        imageUrl:
          "./Messages — OnlyFans_files/960x960_d7c942aa5fa7d53642b56615d4c592f9.jpg",
        mediaTypes: ["image", "image"],
        type: "purchase",
        vaultName: "Unknown",
        content:
          "1/ 52TagsAndrew DeltaDerek Cox - Caleb Fo...This two long duration content of mine is between us only so i hope you like and appreciate what daddy made it to you😈🍆\n" +
          " 6:12 pm  $40 not paid yet"
      },
      {
        id: "",
        price: 30,
        time: "2024-05-15T18:36:00.000Z",
        status: "Read",
        paidStatus: "Not Paid",
        imageUrl:
          "./Messages — OnlyFans_files/960x1286_b18c3e422d44bee7960edb09f0efd07e.jpg",
        mediaTypes: ["image", "video"],
        type: "purchase",
        vaultName: "Unknown",
        content:
          "Play Video TagsNoah WhiteCan i destroy your tight hole and dominate you like this?😈😈😈\n" +
          " 9:36 pm  $30 not paid yet"
      },
      // {
      //   id: "",
      //   price: 5,
      //   time: "2024-06-12T19:54:00.000Z",
      //   status: "Not Read",
      //   paidStatus: "Paid",
      //   imageUrl:
      //     "./Messages — OnlyFans_files/5856_138700941659_6642246_n(1).jpg",
      //   mediaTypes: [],
      //   type: "tip",
      //   vaultName: "Unknown",
      //   content:
      //     "I sent you a $5.00 tip Hi Legrand! Just watched you scene with Braxxton Cruz and had to say thanks with a small tip!! You guys are so fucking hot together and the facial expressions on both of you truly show the chemistry between you. Love seeing real men pleasuring each other and you do it so patiently and beautifully it makes me fall in love with both of you. Would love to see you with him again and breed his beautiful cute ass. Plz!! Thanks for all your posts here and on Carnal. Your studio is becoming a real favorite for me. Big hugs for a beautiful man.\n" +
      //     " 1:54 am"
      // },
      {
        id: "",
        price: 20,
        time: "2024-06-17T19:09:00.000Z",
        status: "Read",
        paidStatus: "Not Paid",
        imageUrl:
          "./Messages — OnlyFans_files/960x1707_63a0c8eb8f5f372fff12a41c34e31241_frame_0.jpg",
        mediaTypes: ["video"],
        type: "purchase",
        vaultName: "Unknown",
        content:
          "Play Video TagsDevin FrancoEddie PatrickI've got just the video for you, Jerry. I think you're gonna fucking love it, handsome. 30 minutes of me and Eddie. It got fucking intense!\n" +
          " 10:09 pm  $20 not paid yet"
      }
    ]);
  });

  it("should parse payments correctly from the provided HTML2", () => {
    const htmlString = readHTMLFile("./test_html/payment-test2.html");
    const document = emulateHTML(htmlString);
    const payments = parsePayments(document);
    expectPaymentsToEqualIgnoringContent(payments, [
      // {
      //   id: "",
      //   price: 30,
      //   time: "2023-06-08T18:57:00.000Z",
      //   status: "Not Read",
      //   paidStatus: "Paid",
      //   imageUrl: "./full efrain_files/6oF47oZv_normal.jpg",
      //   mediaTypes: [],
      //   type: "tip",
      //   vaultName: "Unknown",
      //   content: "I sent you a $30.00 tip There you go\n 12:57 am"
      // },
      {
        id: "",
        price: 30,
        time: "2024-02-21T09:46:00.000Z",
        status: "Read",
        paidStatus: "Not Paid",
        imageUrl:
          "./full efrain_files/960x540_9a9d91c416d2202128ea286df6ad5758_frame_0.jpg",
        mediaTypes: ["video"],
        type: "purchase",
        vaultName: "Unknown",
        content: `Legrand Wolf  ,   Feb 21 11:46 am “ I want u to feel my hard dick throbbing and popping inside ur tight butthole! I wanna fuck u from behind while my hands are on ur mouth! Keeping u quiet as I fuck u over and over, stopping u to scream babe!
$30  Play Video TagsFelix FoxOh fuck Efrain, babe! You can feel my dick thrusting and throbbing inside your tight butthole as I pushes it in and out of your tight hole! My hands covering your mouth so that you can't scream! You are biting my fingers a little because of how rough I fuck you from behind! You can hear me moaning too! Pulled your hair and stared at my eyes while fucking you so deep from behind babe!
1:16 pm  $30 not paid yet`
      },
      {
        id: "",
        price: 130,
        time: "2024-04-25T06:45:00.000Z",
        status: "Read",
        paidStatus: "Not Paid",
        imageUrl:
          "./full efrain_files/960x503_e767a261afbc47e0d823f8d8454d0e85.jpg",
        mediaTypes: ["image", "video"],
        type: "purchase",
        vaultName: "Unknown",
        content:
          "Play Video TagsReece ScottI know you like seeing Daddy dominate his submissive twinks. But what if I dominate someone who's also very dominant in bed? Watch how I filled his ass and hear how I made Reece Scott moan with my monstrous cock. NEW and EXCLUSIVE!\n" +
          " 9:45 am  $130 not paid yet"
      },
      {
        id: "",
        price: 40,
        time: "2024-05-15T15:14:00.000Z",
        status: "Read",
        paidStatus: "Not Paid",
        imageUrl:
          "./full efrain_files/960x960_d7c942aa5fa7d53642b56615d4c592f9.jpg",
        mediaTypes: ["image", "image"],
        type: "purchase",
        vaultName: "Unknown",
        content:
          "1/ 52TagsAndrew DeltaDerek Cox - Caleb Fo...This two long duration content of mine is between us only so i hope you like and appreciate what daddy made it to you😈🍆\n" +
          " 6:14 pm  $40 not paid yet"
      },
      {
        id: "",
        price: 30,
        time: "2024-05-15T18:36:00.000Z",
        status: "Read",
        paidStatus: "Not Paid",
        imageUrl:
          "./full efrain_files/960x1286_b18c3e422d44bee7960edb09f0efd07e.jpg",
        mediaTypes: ["image", "video"],
        type: "purchase",
        vaultName: "Unknown",
        content:
          "Play Video TagsNoah WhiteCan i destroy your tight hole and dominate you like this?😈😈😈\n" +
          " 9:36 pm  $30 not paid yet"
      }
    ]);
  });

  it("should parse payments correctly from the provided HTML3", () => {
    const htmlString = readHTMLFile("./test_html/OnlyFans.html");
    const document = emulateHTML(htmlString);
    const payments = parsePayments(document);
    expectPaymentsToEqualIgnoringContent(payments, [
      {
        id: "",
        price: 40,
        time: "2024-06-21T21:50:00.000Z",
        status: "Read",
        paidStatus: "Paid",
        imageUrl:
          "./OnlyFans_files/960x540_e458e5aae1b66b3758e901b904f5cc8b_frame_0.jpg",
        mediaTypes: ["video"],
        type: "purchase",
        vaultName: "Unknown"
        // .content field is ignored
      }
    ]);
  });
});
