// To store the dictionary loaded from the file
let dictionary = [];

// Fetch the dictionary file (words.txt) and load it with frequencies
let wordFrequencies = {};
fetch('words.txt')
    .then(response => response.text())
    .then(text => {
        dictionary = text.split('\n').map(word => word.trim().toUpperCase()).filter(Boolean);
        dictionary.forEach((word, index) => {
            wordFrequencies[word] = index + 1; // The earlier the word, the higher the frequency score
        });
    });

// Calculate the average frequency score of a solution
function calculateSolutionScore(decryptedText) {
    const words = decryptedText.split(/\s+/); // Split decrypted text into words
    let totalScore = 0;
    let wordCount = 0;

    words.forEach(word => {
        if (wordFrequencies[word]) {
            totalScore += wordFrequencies[word]; // Sum the frequencies
            wordCount++;
        }
    });

    return wordCount > 0 ? totalScore / wordCount : 0; // Return the average score
}

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
    const cipherWords = ciphertext.split(/\s+/);

    // Build word patterns from the loaded dictionary
    const wordPatterns = buildWordPatterns(dictionary);

    // Get all possible solutions
    const solutions = iterativeSolve(cipherWords, wordPatterns);

    // Display the results
    const resultContainer = document.getElementById("results");
    resultContainer.innerHTML = '';

    if (solutions.length > 0) {
        let solutionList = [];

        // For each solution, calculate the decrypted text and score
        solutions.forEach((solution, idx) => {
            let decryptedText = ciphertext
                .split('')
                .map(char => (char in solution ? solution[char] : char))
                .join('');
            let score = calculateSolutionScore(decryptedText); // Calculate the score for each solution
            solutionList.push({ decryptedText, score });
        });
        
        // Sort solutions by score (lower score first)
        solutionList.sort((a, b) => a.score - b.score);

        // Display the sorted solutions
        solutionList.forEach((solution, idx) => {
            resultContainer.innerHTML += `<p>Solution ${idx + 1} (Score: ${solution.score.toFixed(2)}): ${solution.decryptedText}</p>`;
        });
    } else {
        resultContainer.innerHTML = "<p>No solutions found.</p>";
    }
}
