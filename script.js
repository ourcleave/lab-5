console.log('Клієнтський скрипт 5-ї лаби завантажено.');

const form = document.querySelector('.feedback-form');
const nameInput = document.querySelector('#name');
const emailInput = document.querySelector('#email');
const listEl = document.querySelector('#submissions-list');

async function loadSubmissions() {
  if (!listEl) return;
  try {
    const res = await fetch('/api/submissions');
    if (!res.ok) throw new Error('Не вдалося завантажити список');
    const items = await res.json();

    listEl.innerHTML = '';
    if (items.length === 0) {
      listEl.innerHTML = '<li style="color: #888; font-size: 14px;">Заявок поки немає.</li>';
      return;
    }

    for (const item of items) {
      const li = document.createElement('li');
      li.style.cssText =
        'background:#1e1e1e; border:1px solid #333; border-radius:6px; padding:12px; display:flex; justify-content:space-between; align-items:center; gap:10px;';

      const infoDiv = document.createElement('div');
      infoDiv.innerHTML = `<strong>${escapeHtml(item.name)}</strong><br><span style="color:#aaa; font-size:13px;">${escapeHtml(item.email)}</span>`;

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.textContent = 'Видалити';
      delBtn.style.cssText =
        'background:#dc2626; color:#fff; border:none; border-radius:4px; padding:6px 10px; cursor:pointer; font-size:12px;';

      delBtn.addEventListener('click', async () => {
        try {
          const delRes = await fetch(`/api/submissions/${item.id}`, { method: 'DELETE' });
          if (!delRes.ok) throw new Error('Помилка видалення');
          await loadSubmissions();
        } catch (err) {
          alert(err.message);
        }
      });

      li.append(infoDiv, delBtn);
      listEl.appendChild(li);
    }
  } catch (err) {
    console.error(err);
  }
}

function escapeHtml(str) {
  return str
    .replaceAll('&', '&')
    .replaceAll('<', '<')
    .replaceAll('>', '>')
    .replaceAll('"', '"');
}

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();

    if (!name || !email) {
      alert('Помилка: заповніть усі поля форми!');
      return;
    }
    if (!email.includes('@')) {
      alert('Помилка: введіть коректний Email!');
      return;
    }

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Помилка збереження на сервері');
        return;
      }

      form.reset();
      await loadSubmissions();
    } catch (err) {
      alert('Немає зв’язку із сервером');
    }
  });
}

loadSubmissions();