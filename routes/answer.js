const Filter = require("bad-words");
const axios = require("axios");
const express = require("express");
const router = express.Router();

const apiKey = process.env.OPENAI_API_KEY;
const client = axios.create({
  headers: { Authorization: "Bearer " + apiKey },
});

// Add your documents here. These will be used to answer questions. You can add up to 200.
// Alternately, you can store documents in a file. See: https://beta.openai.com/docs/api-reference/answers
const documents = [
  "The name of this app is Custom knowledge Walet.<|endoftext|>",
  "This app was built using JavaScript and Node.JS.<|endoftext|>",
  "The app has a simple HTML form that users can use to submit questions.<|endoftext|>",
  "GPT-3 will use documents provided by the developer as a knowledge base to derive answers from.<|endoftext|>",
  "This is an example application that can be used to learn how to build apps using the OpenAI API.<|endoftext|>",
];

const endpoint = "https://api.openai.com/v1/chat/completions";

router.post("/", (req, res) => {
  // Ensure the OPENAI_API_KEY env var is set
  if (!apiKey) {
    res.send({ answer: "You need to setup your API key." });
    return;
  }

  // Respond if the request length is too long
  if (req.body.question.length > 150) {
    res.send({ answer: "Sorry. That question is too long." });
    return;
  }

  // Don't send questions that contain bad words
  let filter = new Filter();
  if (filter.isProfane(req.body.question)) {
    res.send({ answer: "That’s not a question we can answer." });
    return;
  }

  // Setup the data payload for the answers endpoint
  const data = {
    max_tokens: 256,
    stop: ["\n", "\n\n"],
    temperature: 0.5,
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: req.body.question,
      },
    ],
  };

  client
    .post(endpoint, data)
    .then((result) => {
      // Assuming result.data.choices[0].message.content contains the desired text
      const answerText = result.data.choices[0].message.content;
      const answer = documents.find((doc) => doc.includes(answerText));
      res.send({ answer: answerText }); // Send the response once
    })
    .catch((err) => {
      if (err.response) {
        console.error(err.response.data);
        res.send({
          answer: `Sorry, there was an API error. The error was '${err.response.data.message}'`,
        });
      } else {
        console.error(err); // Log the error object itself if `err.response` doesn't exist
        res.send({
          answer: `Sorry, there was an error. The error was '${err.message}'`,
        });
      }
    });
});

module.exports = router;
