setInterval(() => {
    document.querySelectorAll("span.lh_1rem.fs_0\\.75rem.ls_0\\.03125rem.fw_500")
        .forEach(el => {

            const match = el.textContent.match(/Stoat for Desktop\s+([0-9.]+)/);

            if (match) {
                const stoatVersion = match[1];

                el.innerHTML = `
                    Avia Client Desktop<br>
                    <span style="font-size:10px;opacity:0.7;">
                        Based on Stoat ${stoatVersion}
                    </span>
                `;
            }

        });
}, 1000);
