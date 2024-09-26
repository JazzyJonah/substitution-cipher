// To store the dictionary loaded from the file
let dictionary = [];

// Fetch the dictionary file (words.txt) and load it
fetch('words.txt')
    .then(response => response.text())
    .then(text => {
        dictionary = text.split('\n').map(word => word.trim().toUpperCase()).filter(Boolean);
    });

// Function to generate word patterns
function getWordPattern(word) {
    const letterMap = {};
    let nextNumber = 0;
    return word
        .toUpperCase()
        .split('')
        .map(char => {
            if (!letterMap[char]) {
                letterMap[char] = nextNumber++;
            }
            return letterMap[char];
        })
        .join('.');
}

// Build word patterns dictionary
function buildWordPatterns(wordList) {
    const patterns = {};
    wordList.forEach(word => {
        const pattern = getWordPattern(word);
        if (!patterns[pattern]) {
            patterns[pattern] = [];
        }
        patterns[pattern].push(word);
    });
    return patterns;
}

// Check if the character mappings are consistent
function isConsistent(mapping, cipherChar, plainChar) {
    if (mapping[cipherChar]) {
        return mapping[cipherChar] === plainChar;
    }
    if (Object.values(mapping).includes(plainChar)) {
        return false;
    }
    return true;
}

// Tokenize text into words, punctuation, and spaces
function tokenize(text) {
    const regex = /([A-Z]+|[^\w\s]|\s)/g; // Tokenizes words, punctuation, and spaces separately
    return text.match(regex);
}

// Iterative backtracking solution
function iterativeSolve(cipherWords, wordPatterns) {
    const stack = [];
    let allSolutions = [];
    let mappings = {};
    let index = 0;

    stack.push({ index, mappings });

    while (stack.length > 0) {
        const { index, mappings } = stack.pop();

        if (index === cipherWords.length) {
            // Solution found, add to all solutions
            allSolutions.push({ ...mappings });
            continue;
        }

        const cipherWord = cipherWords[index];
        // Skip punctuation and spaces (they are not mapped)
        if (!cipherWord.match(/[A-Z]/)) {
            stack.push({ index: index + 1, mappings });
            continue;
        }

        const pattern = getWordPattern(cipherWord);
        const possibleWords = wordPatterns[pattern] || [];

        for (const plainWord of possibleWords) {
            let consistent = true;
            const tempMapping = { ...mappings };

            for (let i = 0; i < cipherWord.length; i++) {
                const cChar = cipherWord[i];
                const pChar = plainWord[i];
                if (!isConsistent(tempMapping, cChar, pChar)) {
                    consistent = false;
                    break;
                }
                tempMapping[cChar] = pChar;
            }

            if (consistent) {
                stack.push({ index: index + 1, mappings: tempMapping });
            }
        }
    }
    return allSolutions;
}

// Decrypt function that gets called when the button is clicked
function decrypt() {
    const ciphertext = document.getElementById("ciphertext").value.trim().toUpperCase();

    // Tokenize text and retain punctuation, spaces, and words
    const cipherTokens = tokenize(ciphertext);

    // Build word patterns from the loaded dictionary
    const wordPatterns = buildWordPatterns(dictionary);

    // Get all possible solutions
    const solutions = iterativeSolve(cipherTokens, wordPatterns);

    // Display the results
    const resultContainer = document.getElementById("results");
    resultContainer.innerHTML = '';

    if (solutions.length > 0) {
        solutions.forEach((solution, idx) => {
            let decryptedText = cipherTokens
                .map(char => (char.match(/[A-Z]/) ? (solution[char] || char) : char))
                .join('');  // Keep the spaces and punctuation in place
            resultContainer.innerHTML += `<p>Solution ${idx + 1}: ${decryptedText}</p>`;
        });
    } else {
        resultContainer.innerHTML = "<p>No solutions found.</p>";
    }
}
