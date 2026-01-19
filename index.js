(function () {
  function HelloWorld() {
    var [joke, setJoke] = React.useState(null);

    React.useEffect(function () {
      fetch("https://official-joke-api.appspot.com/random_joke")
        .then(function (res) { return res.json(); })
        .then(function (data) { setJoke(data); });
    }, []);

    return React.createElement(
      "div",
      {
        style: {
          padding: "16px",
          border: "1px solid #ccc",
          marginTop: "16px"
        }
      },
      React.createElement("div", null, "Hello World from React"),
      joke
        ? React.createElement(
            "div",
            { style: { marginTop: "12px", fontSize: "14px" } },
            React.createElement("strong", null, joke.setup),
            React.createElement("div", null, joke.punchline)
          )
        : React.createElement("div", { style: { marginTop: "12px", fontSize: "14px" } }, "Loading joke...")
    );
  }

  window.EventPOC = {
    mount: function (el) {
      ReactDOM.createRoot(el).render(React.createElement(HelloWorld));
    }
  };
})();
