const Filter = require('bad-words');
const axios = require('axios');
const express = require('express');
const router = express.Router();

const apiKey = process.env.OPENAI_API_KEY;
const client = axios.create({
  headers: { 'Authorization': 'Bearer ' + apiKey }
});

// Add your documents here. These will be used to answer questions. You can add up to 200.
// Alternately, you can store documents in a file. See: https://beta.openai.com/docs/api-reference/answers 
const documents = [
  "This app was built using JavaScript and Node.JS.<|endoftext|>",
  "The app has a simple HTML form that users can use to submit questions.<|endoftext|>",
  "GPT-3 will use documents provided by the developer as a knowledge base to derive answers from.<|endoftext|>",
  "This is an example application that can be used to learn how to build apps using the OpenAI API.<|endoftext|>"
]

// const endpoint = 'https://api.openai.com/v1/answers';
const endpoint = 'https://api.openai.com/v1/engines/davinci-codex/completions';

router.post('/', (req, res) => {
  // Ensure the OPENAI_API_KEY env var is set
  if (!apiKey) {
    res.send({ "answer": "You need to setup your API key." });
    return;
  }

  // Respond if the request length is too long
  if (req.body.question.length > 150) {
    res.send({ "answer": "Sorry. That question is too long." });
    return;
  }

  // Don't send questions that contain bad words
  let filter = new Filter();
  if (filter.isProfane(req.body.question)) {
    res.send({ "answer": "That’s not a question we can answer." });
    return;
  }

  // Setup the data payload for the answers endpoint
  const data = {
    "documents": documents,
    "question": req.body.question,
    "model": "davinci", // Adjust based on your OpenAI plan and model preference
    "examples_context": "In 2017, U.S. life expectancy was 78.6 years.", // This is a context used by some types of queries, may not be needed for your case
    "examples": [["What is human life expectancy in the United States?", "78 years."]], // Example Q&A pairs
    "max_tokens": 256,
    "stop": ["\n", "\n\n"], // Defines stop sequences for the generation
  };

  client.post(endpoint, data)
    .then(result => {
      // The structure of the response might differ, ensure to adjust access accordingly
      res.send({ "answer": result.data.answers[0] });
    }).catch(err => {
      console.error(err.response.data); // Log the detailed error message from OpenAI
      res.send({ "answer": `Sorry, there was an API error. The error was '${err.message}'` });
    });
});

/*
  const data = {
    // "file": process.env.ANSWERS_FILE,
    "documents": documents,
    "question": req.body.question,
    "search_model": "ada",
    "model": "curie",
    "examples_context": "My favorite programming language is Python.",
    "examples": [["How old are you?", "I'm a day older than I was yesterday."], ["What languages do you know?", "I speak English and write code in Python."]],
    "max_tokens": 15,
    "temperature": 0,
    "return_prompt": false,
    "expand": ["completion"],
    "stop": ["\n", "<|endoftext|>"],
  }

  client.post(endpoint, data)
    .then(result => {
      res.send({ "answer": result.data.answers[0] })
    }).catch(err => {
      // deal with API request errors
      res.send({ "answer": `Sorry, there was an API error. The error was '${err.message}'` })
    });
*/


module.exports = router;

