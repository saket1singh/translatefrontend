
async function translateText() {
  const inputText = document.getElementById('inputText').value;

  const res = await fetch('http://localhost:5000/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: inputText })
  });

  const data = await res.json();
  const telugu = data.translation;

  // ✅ Await the async breakdown function
  const breakdown = await getBreakdown(telugu);

 document.getElementById('translatedText').innerHTML = `
  <strong>Hindi:</strong> ${inputText}<br>
  <strong>Telugu:</strong> ${telugu}
  <br><br><strong>Breakdown:</strong><br>${breakdown}
`;

speakText(telugu); 
}


function loadExample(category) {
  const examples = {
    casual: "नमस्ते, आप कैसे हैं?",
    office: "मैं मीटिंग के लिए तैयार हूँ।",
    food: "क्या आपने खाना खाया?",
    student: "मुझे होमवर्क पूरा करना है।"
  };
  document.getElementById('inputText').value = examples[category];
}

async function getBreakdown(teluguText) {
  const res = await fetch('http://localhost:5000/breakdown', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: teluguText })
  });

  const data = await res.json();

  return data.breakdown.map(entry => {
    return `<strong>${entry.telugu}</strong> (${entry.roman}): ${entry.hindi}`;
  }).join("<br>");
}


function startVoiceInput() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'hi-IN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  const micStatus = document.getElementById('micStatus');
  micStatus.style.display = 'block'; // Show mic indicator

  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript;
    document.getElementById('inputText').value = transcript;
    micStatus.style.display = 'none'; // Hide after done
    translateText(); // auto translate
  };

  recognition.onerror = function(event) {
    alert("Voice input error: " + event.error);
    micStatus.style.display = 'none';
  };

  recognition.onend = function() {
    micStatus.style.display = 'none';
  };

  recognition.start();
}
function startLiveTranslation() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'te-IN';
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = async function(event) {
    const resultIndex = event.resultIndex;
    const teluguText = event.results[resultIndex][0].transcript;

    // Optional: filter out repeating partials
    if (!teluguText.trim()) return;

    const res = await fetch('http://localhost:5000/translate-live', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: teluguText })
    });

    const data = await res.json();

    document.getElementById('liveOutput').innerHTML = `
      <strong>Telugu:</strong> ${teluguText}<br>
      <strong>Hindi:</strong> ${data.translation}
    `;
  };

  recognition.onerror = function(event) {
    console.error("Speech recognition error:", event.error);
  };

  recognition.onend = function() {
    console.warn("Restarting recognition...");
    recognition.start(); // 🔁 Restart after auto-stop
  };

  recognition.start();
}

function speakText(text) {
  function doSpeak() {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();

    // Log available voices
    console.log("Available voices:", voices);

    // Try to find a Telugu or Indian voice
    const teluguVoice = voices.find(v =>
      v.lang.toLowerCase().includes('te') || 
      v.name.toLowerCase().includes('telugu')
    ) || voices.find(v => v.lang.includes('en-IN')); // fallback

    if (teluguVoice) {
      utterance.voice = teluguVoice;
      console.log("Using voice:", teluguVoice.name, teluguVoice.lang);
    } else {
      console.warn("No Telugu voice found, using default.");
    }

    utterance.lang = teluguVoice?.lang || 'te-IN';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
  }

  // Ensure voices are loaded
  if (speechSynthesis.getVoices().length === 0) {
    speechSynthesis.onvoiceschanged = () => doSpeak();
  } else {
    doSpeak();
  } 
}


