let encryptionKey;
let encryptionIV;

function padKey(key) {
    return key.padEnd(32, key); // Pad the key to 32 bytes (AES-256 requires 32 bytes)
}

async function encryptMessage() {
    try {
        const message = document.getElementById('message').value;
        if (!message) {
            alert("Please enter a message.");
            return;
        }

        // Ask the user for an encryption key (3-5 characters)
        const userKey = prompt("Enter a key (must be 3-5 characters):");
        if (!userKey || userKey.length < 3 || userKey.length > 5) {
            alert("Key must be between 3 and 5 characters long.");
            return;
        }

        // Pad the user's key to meet the length requirement
        const paddedKey = padKey(userKey);
        const encodedKey = new TextEncoder().encode(paddedKey);

        // Import the padded key as an AES-GCM key
        encryptionKey = await crypto.subtle.importKey(
            "raw",
            encodedKey,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
        );

        // Generate an initialization vector (IV)
        encryptionIV = crypto.getRandomValues(new Uint8Array(12));

        // Encode the message as a Uint8Array
        const encoder = new TextEncoder();
        const data = encoder.encode(message);

        // Encrypt the message
        const encryptedContent = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: encryptionIV,
            },
            encryptionKey,
            data
        );

        // Convert encrypted content to a Base64 string
        const encryptedArray = new Uint8Array(encryptedContent);
        const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray));

        // Display encrypted message
        const encryptedMessageElement = document.getElementById('encryptedMessage');
        encryptedMessageElement.textContent = encryptedBase64;

        alert("Message encrypted successfully!");
    } catch (error) {
        console.error("Error occurred while encrypting:", error);
        alert("Error occurred while encrypting. Check the console for details.");
    }
}

async function decryptMessage() {
    try {
        const encryptedMessage = document.getElementById('encryptedMessage').textContent;
        if (!encryptedMessage) {
            alert("No encrypted message found.");
            return;
        }

        // Ask the user for the decryption key (3-5 characters)
        const userKey = prompt("Enter the decryption key:");
        if (!userKey || userKey.length < 3 || userKey.length > 5) {
            alert("Key must be between 3 and 5 characters long.");
            return;
        }

        // Pad the user's key to match the key used during encryption
        const paddedKey = padKey(userKey);
        const encodedKey = new TextEncoder().encode(paddedKey);

        // Import the padded key for decryption
        const decryptionKey = await crypto.subtle.importKey(
            "raw",
            encodedKey,
            { name: "AES-GCM", length: 256 },
            false,
            ["decrypt"]
        );

        // Convert Base64 string back to a Uint8Array
        const encryptedArray = Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0));

        // Decrypt the message using the user-provided key and IV
        const decryptedContent = await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: encryptionIV, // Use the same IV from encryption
            },
            decryptionKey,
            encryptedArray
        );

        // Decode the decrypted content back to a string
        const decoder = new TextDecoder();
        const decryptedMessage = decoder.decode(decryptedContent);

        // Display decrypted message
        const decryptedMessageElement = document.getElementById('decryptedMessage');
        decryptedMessageElement.textContent = decryptedMessage;

        alert("Message decrypted successfully!");
    } catch (error) {
        console.error("Error occurred while decrypting:", error);
        alert("Error occurred while decrypting. Check the console for details.");
    }
}




let encryptedBlob = null;
let decryptedBlob = null;

async function encryptFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a file to encrypt.");
        return;
    }

    const key = prompt("Please enter a 3-4 character key for encryption:");
    if (key.length < 3 || key.length > 4) {
        alert("Key must be between 3 and 4 characters long.");
        return;
    }

    const paddedKey = padKey(key);
    const encKey = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(paddedKey),
        { name: "AES-CBC" },
        false,
        ["encrypt"]
    );

    const iv = crypto.getRandomValues(new Uint8Array(16));

    const reader = new FileReader();
    reader.onload = async function(event) {
        const fileContent = event.target.result;

        try {
            const encryptedData = await crypto.subtle.encrypt(
                { name: "AES-CBC", iv: iv },
                encKey,
                fileContent
            );

            const combinedBuffer = new Uint8Array(iv.length + encryptedData.byteLength);
            combinedBuffer.set(iv);
            combinedBuffer.set(new Uint8Array(encryptedData), iv.length);

            encryptedBlob = new Blob([combinedBuffer], { type: "application/octet-stream" });

            // Show the download link for the encrypted file
            const encryptedFileLink = document.getElementById('encryptedFileLink');
            encryptedFileLink.href = URL.createObjectURL(encryptedBlob);
            encryptedFileLink.style.display = 'inline';  // Make the link visible
        } catch (err) {
            console.error("Error encrypting the file:", err);
        }
    };
    reader.readAsArrayBuffer(file);
}

async function decryptFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select an encrypted file to decrypt.");
        return;
    }

    const key = prompt("Please enter the 3-4 character key for decryption:");
    if (key.length < 3 || key.length > 4) {
        alert("Key must be between 3 and 4 characters long.");
        return;
    }

    const paddedKey = padKey(key);
    const decKey = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(paddedKey),
        { name: "AES-CBC" },
        false,
        ["decrypt"]
    );

    const reader = new FileReader();
    reader.onload = async function(event) {
        const combinedBuffer = new Uint8Array(event.target.result);
        const iv = combinedBuffer.slice(0, 16); // Extract the IV
        const encryptedContent = combinedBuffer.slice(16); // Extract the encrypted content

        try {
            const decryptedData = await crypto.subtle.decrypt(
                { name: "AES-CBC", iv: iv },
                decKey,
                encryptedContent
            );

            decryptedBlob = new Blob([decryptedData], { type: "application/octet-stream" });

            // Show the download link for the decrypted file
            const decryptedFileLink = document.getElementById('decryptedFileLink');
            decryptedFileLink.href = URL.createObjectURL(decryptedBlob);
            decryptedFileLink.style.display = 'inline';  // Make the link visible
        } catch (err) {
            console.error("Error decrypting the file:", err);
        }
    };
    reader.readAsArrayBuffer(file);
}

function padKey(key) {
    return key.padEnd(16, '0'); // Pad the key to 16 bytes (AES requires 16 bytes)
}