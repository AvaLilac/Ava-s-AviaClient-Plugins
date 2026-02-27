(function(){

const data = {};

for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    try {
        data[key] = localStorage.getItem(key);
    } catch (e) {
        data[key] = "Unreadable";
    }
}

const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: "application/json" }
);

const url = URL.createObjectURL(blob);

const a = document.createElement("a");
a.href = url;
a.download = "localStorage_backup.json";
document.body.appendChild(a);
a.click();

document.body.removeChild(a);
URL.revokeObjectURL(url);

console.log("localStorage exported.");

})();
