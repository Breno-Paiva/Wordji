// The letter-box answer component — the shared input surface for both game
// modes, same role as Chordji's keyboard.js. Renders one box per letter for
// translating, or a single wide box for a typed conjugated form, and mirrors
// whatever the player types into a hidden text input.

function box(extraClass) {
  const div = document.createElement("div");
  div.className = extraClass ? `letter-box ${extraClass}` : "letter-box";
  return div;
}

export function createLetterInput(rowEl) {
  function render(length, { wide = false } = {}) {
    rowEl.innerHTML = "";
    if (wide) {
      rowEl.appendChild(box("wide"));
    } else {
      for (let i = 0; i < length; i++) rowEl.appendChild(box());
    }
  }

  function update(value) {
    const boxes = rowEl.children;
    if (boxes.length === 1 && boxes[0].classList.contains("wide")) {
      boxes[0].textContent = value.toUpperCase();
      return;
    }
    for (let i = 0; i < boxes.length; i++) {
      boxes[i].textContent = value[i] ? value[i].toUpperCase() : "";
    }
  }

  function reveal(answer, label) {
    const boxes = rowEl.children;
    if (boxes.length === 1 && boxes[0].classList.contains("wide")) {
      boxes[0].textContent = answer.toUpperCase();
      boxes[0].classList.add("reveal");
    } else {
      for (let i = 0; i < boxes.length; i++) {
        boxes[i].textContent = answer[i].toUpperCase();
        boxes[i].classList.add("reveal");
      }
    }
    return label ? `${label} → ${answer.toUpperCase()}` : answer.toUpperCase();
  }

  function flash(className) {
    const boxes = rowEl.children;
    for (let i = 0; i < boxes.length; i++) {
      boxes[i].classList.remove("flash-correct", "flash-wrong", "flash-skip");
      void boxes[i].offsetWidth; // force reflow so the animation retriggers
      boxes[i].classList.add(className);
    }
  }

  function shake() {
    rowEl.classList.remove("shake");
    void rowEl.offsetWidth;
    rowEl.classList.add("shake");
  }

  return { render, update, reveal, flash, shake };
}
