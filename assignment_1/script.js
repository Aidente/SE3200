const themeButton = document.querySelector("#themeButton");

themeButton.addEventListener("click", changeTheme);

function changeTheme(){
    if (document.body.classList.contains("rainbowTheme")){
        const currentColor = getComputedStyle(document.body).backgroundColor;
        document.body.style.backgroundColor = currentColor;
        document.body.classList.remove("rainbowTheme")
        requestAnimationFrame(function() {
            document.body.style.backgroundColor = "#799de5";
        });
    }
    else{
        document.body.classList.add("rainbowTheme");
    }
}