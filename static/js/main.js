function update_main(){
  const chatWindow = document.getElementById('chat-window');
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const stopGeneration = document.getElementById("stop-generation")
    
  stopGeneration.addEventListener('click', (event) =>{
    event.preventDefault();
    console.log("Stop clicked");
    fetch('/stop_gen')
    .then(response => response.json())
    .then(data => {
        console.log(data);
    });
      
  })


  function submit_form(){
    console.log("Submitting")
  
    // get user input and clear input field
    message = userInput.value;
    userInput.value = '';
    
    // add user message to chat window
    const sendbtn = document.querySelector("#submit-input")
    const waitAnimation = document.querySelector("#wait-animation")
    const stopGeneration = document.querySelector("#stop-generation")
    
    sendbtn.style.display="none";
    waitAnimation.style.display="block";
    stopGeneration.style.display = "block";
    console.log("Sending message to bot")

    user_msg = addMessage('',message, 0, 0, can_edit=true);
    bot_msg = addMessage('', '', 0, 0, can_edit=true);
    // scroll to bottom of chat window
    chatWindow.scrollTop = chatWindow.scrollHeight;

    fetch('/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
    }).then(function(response) {
        const stream = new ReadableStream({
            start(controller) {
                const reader = response.body.getReader();
                function push() {
                    reader.read().then(function(result) {
                        if (result.done) {
                            sendbtn.style.display="block";
                            waitAnimation.style.display="none";
                            stopGeneration.style.display = "none";
                            console.log(result)
                            controller.close();
                            return;
                        }
                        controller.enqueue(result.value);
                        push();
                    })
                }
                push();
            }
        });
        const textDecoder = new TextDecoder();
        const readableStreamDefaultReader = stream.getReader();
        let entry_counter = 0
        function readStream() {
            readableStreamDefaultReader.read().then(function(result) {
                if (result.done) {
                    return;
                }

                text = textDecoder.decode(result.value);

                // The server will first send a json containing information about the message just sent
                if(entry_counter==0)
                {
                  // We parse it and
                  infos = JSON.parse(text);

                  user_msg.setSender(infos.user);
                  user_msg.setMessage(infos.message);
                  user_msg.setID(infos.id);
                  bot_msg.setSender(infos.bot);
                  bot_msg.setID(infos.response_id);

                  bot_msg.messageTextElement;
                  bot_msg.hiddenElement;
                  entry_counter ++;
                }
                else{
                  entry_counter ++;   
                  prefix = "FINAL:";
                  if(text.startsWith(prefix)){
                      text = text.substring(prefix.length);
                      bot_msg.hiddenElement.innerHTML         = text
                      bot_msg.messageTextElement.innerHTML    = text
                  }
                  else{
                  // For the other enrtries, these are just the text of the chatbot
                  txt = bot_msg.hiddenElement.innerHTML;
                  txt += text
                  bot_msg.hiddenElement.innerHTML         = txt;
                  bot_msg.messageTextElement.innerHTML    = txt;
                  // scroll to bottom of chat window
                  chatWindow.scrollTop = chatWindow.scrollHeight;

                  }
                }

                readStream();
            });
        }
        readStream();
    });
  }
  chatForm.addEventListener('submit', event => {
      event.preventDefault();
      submit_form();
  });  
  userInput.addEventListener("keyup", function(event) {
    // Check if Enter key was pressed while holding Shift
    // Also check if Shift + Ctrl keys were pressed while typing
    // These combinations override the submit action
    const shiftPressed = event.shiftKey;
    const ctrlPressed = event.ctrlKey && !event.metaKey;

    if ((!shiftPressed) && event.key === "Enter") {
        submit_form();
    }
    // Restore original functionality for the remaining cases
    else if (!shiftPressed && ctrlPressed) {
      setTimeout(() => {
        userInput.focus();
        contentEditable.value += event.data;
        lastValue.innerHTML = userInput.value;
      }, 0);
    }
  });
}