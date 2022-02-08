import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-monokai";

import styles from './app.module.css';

function onChange(newValue) {
    console.log("change", newValue);
}

function App() {
  return (
    <div className="App">
      <AceEditor
          className={styles.editor}
          style={{}}
          width="100%"
          placeholder="Placeholder Text"
          mode="javascript"
          theme="monokai"
          name="blah2"
          onChange={onChange}
          fontSize={14}
          showPrintMargin={false}
          showGutter={true}
          highlightActiveLine={true}
          value={`function onLoad(editor) {
  console.log("i've loaded");
}`}
          setOptions={{
            enableBasicAutocompletion: false,
            enableLiveAutocompletion: false,
            enableSnippets: false,
            showLineNumbers: true,
            tabSize: 2,
          }}
      />
    </div>
  );
}

export default App;
