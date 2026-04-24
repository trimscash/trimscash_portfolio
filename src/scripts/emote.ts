const emoteEl = document.getElementById("emote");
if (emoteEl) {
  try {
    const list = JSON.parse(emoteEl.dataset.emotes || "[]");
    if (list.length) {
      const pick = list[Math.floor(Math.random() * list.length)];
      emoteEl.textContent = pick;
    }
  } catch {}
}
