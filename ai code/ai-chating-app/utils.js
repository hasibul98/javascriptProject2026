const ChatUtils = (() => {
    const escapeHtml = (value = "") => String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    const inlineMarkdown = (value = "") => escapeHtml(value)
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\*([^*]+)\*/g, "<em>$1</em>")
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');

    const tokenName = index => `@@STRING_${String.fromCharCode(65 + index)}@@`;

    const highlightCode = (code = "") => {
        const escaped = escapeHtml(code);
        const strings = [];
        const protectedCode = escaped.replace(/(&quot;.*?&quot;|&#039;.*?&#039;|`.*?`)/g, value => {
            const token = tokenName(strings.length);
            strings.push(`<span class="tok-string">${value}</span>`);
            return token;
        });

        let highlighted = protectedCode
            .replace(/\b(const|let|var|function|return|if|else|for|while|class|new|async|await|try|catch|import|export|from)\b/g, '<span class="tok-keyword">$1</span>')
            .replace(/\b(\d+)\b/g, '<span class="tok-number">$1</span>');

        strings.forEach((value, index) => {
            highlighted = highlighted.replace(tokenName(index), value);
        });

        return highlighted;
    };

    const renderMarkdown = (text = "") => {
        const blocks = [];
        let safe = String(text).replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang = "code", code = "") => {
            const token = `@@CODE_BLOCK_${blocks.length}@@`;
            blocks.push(`<pre class="code-block"><span>${escapeHtml(lang || "code")}</span><code>${highlightCode(code.trim())}</code></pre>`);
            return token;
        });

        safe = safe
            .split(/\n{2,}/)
            .map(part => {
                const trimmed = part.trim();
                if (!trimmed) return "";
                if (trimmed.startsWith("@@CODE_BLOCK_")) return trimmed;
                if (/^#{1,3}\s/.test(trimmed)) {
                    const level = Math.min(trimmed.match(/^#+/)[0].length, 3);
                    return `<h${level}>${inlineMarkdown(trimmed.replace(/^#{1,3}\s/, ""))}</h${level}>`;
                }
                if (/^[-*]\s/m.test(trimmed)) {
                    const items = trimmed.split("\n").filter(Boolean).map(line => `<li>${inlineMarkdown(line.replace(/^[-*]\s/, ""))}</li>`).join("");
                    return `<ul>${items}</ul>`;
                }
                return `<p>${inlineMarkdown(trimmed).replaceAll("\n", "<br>")}</p>`;
            })
            .join("");

        blocks.forEach((block, index) => {
            safe = safe.replace(`@@CODE_BLOCK_${index}@@`, block);
        });

        return safe;
    };

    const formatTime = date => new Date(date).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

    const downloadFile = (filename, content, type) => {
        const blob = new Blob([content], { type });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    return { escapeHtml, renderMarkdown, formatTime, downloadFile, uid };
})();
