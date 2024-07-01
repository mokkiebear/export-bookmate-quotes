function extractBookAndUserId(url) {
  const urlObj = new URL(url);
  const bookId = urlObj.pathname.split("/").pop();
  const userId = urlObj.searchParams.get("username");

  return {
    bookId: bookId,
    userId: userId,
  };
}

async function getQuotes(bookId, userLogin) {
  let page = 1; // Инициализируем переменную страницы с 1
  const allQuotes = []; // Создаем пустой массив для хранения всех цитат

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      // Бесконечный цикл для выполнения запросов до тех пор, пока не будут получены все цитаты
      const response = await fetch(
        `https://bookmate.ru/p/api/v5/books/${bookId}/quotes?&page=${page}&per_page=1000&user_login=${userLogin}&lang=ru`
      );
      const reader = response.body.getReader(); // Получаем объект чтения потока
      const decoder = new TextDecoder(); // Создаем декодер текста
      let result = ""; // Инициализируем пустую строку для накопления результата

      let done, value;
      while (!done) {
        // Цикл чтения данных из потока
        ({ done, value } = await reader.read()); // Читаем следующую порцию данных
        if (value) {
          result += decoder.decode(value, { stream: true }); // Декодируем данные и добавляем их к результату
        }
      }

      console.log(`Stream complete for page ${page}`); // Логируем завершение чтения потока для текущей страницы

      // Парсим результат в JSON
      const data = JSON.parse(result);

      // Прерываем цикл, если массив цитат пуст
      if (data.quotes.length === 0) {
        break;
      }

      // Извлекаем свойство "content" из каждой цитаты и добавляем в массив allQuotes
      const contents = data.quotes.map((quote) => quote.content);
      allQuotes.push(...contents);

      // Увеличиваем номер страницы для следующего запроса
      page++;
    }

    return allQuotes; // Возвращаем объединенный массив всех цитат
  } catch (error) {
    console.error("Error:", error); // Логируем ошибку в случае возникновения
  }
}

function copyToClipboard(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function downloadQuotes(quotes) {
  const blob = new Blob([quotes], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Обработчик нажатия на кнопку
document.getElementById("fetch-quotes").addEventListener("click", async () => {
  const urlId = document.getElementById("url-id").value;

  if (!urlId) {
    alert("Пожалуйста, вставьте ссылку на книгу");
    return;
  }

  const bookElement = document.getElementById("book-id");
  const userElement = document.getElementById("user-id");

  const { bookId, userId } = extractBookAndUserId(urlId);

  bookElement.textContent = `ID книги: ${bookId}`;
  userElement.textContent = `ID пользователя: ${userId}`;

  if (!bookId || !userId) {
    alert("Не удалось извлечь ID книги или ID пользователя");
    return;
  }

  const quotes = await getQuotes(bookId, userId);

  const quotesContainer = document.getElementById("quotes");
  const noQuotesElement = document.getElementById("message-block");

  if (quotes.length === 0) {
    noQuotesElement.textContent = "Цитаты для этой книги не найдены.";
    noQuotesElement.classList.remove("hidden");
    quotesContainer.innerHTML = "";
  } else {
    noQuotesElement.classList.add("hidden");
    quotesContainer.innerHTML = quotes
      .map((quote) => `<p>${quote}</p><br />`)
      .join("");
  }

  // Add event listener to copy quotes button
  document.getElementById("copy-quotes").addEventListener("click", () => {
    copyToClipboard(quotes.join("\n\n"));
    alert("Цитаты скопированы в буфер обмена");
  });

  // Add event listener to download quotes button
  document.getElementById("download-quotes").addEventListener("click", () => {
    downloadQuotes(quotes.join("\n\n"));
  });
});
