import AceEditor from "react-ace";
import {useCallback, useMemo, useState} from "react";

// Vendor styles
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-monokai";

// Styles
import styles from './app.module.css';

// Components
import Files from "./Files/Files";

const scale = 1;

const getLanguageFromFilename = (fileName) => {
    if (fileName.endsWith('.js')) {
        return 'javascript';
    }

    if (fileName.endsWith('.html')) {
        return 'html';
    }
};

function App() {
    const [files, setFiles] = useState([{ name: 'untitled.js', isSelected: true, content: '' }]);
    const [currentFileIndex, setCurrentFileIndex] = useState(0);

    const onChange = useCallback((content) => {
        setFiles([
            ...files.map((file, idx) => {
                if (currentFileIndex === idx) {
                    return {
                        ...file,
                        content,
                    };
                }

                return file;
            }),
        ]);
    }, [currentFileIndex, files]);

    const currentFile = useMemo(() => {
        return {
            ...files[currentFileIndex],
            mode: getLanguageFromFilename(files[currentFileIndex].name),
        };
    }, [currentFileIndex, files]);

    return (
        <div
            className={styles.container}
            style={{
                width: `${960 * scale}px`,
                height: `${540 * scale}px`,
            }}
        >
            <div
                style={{
                    width: '50%',
                    backgroundColor: '#2f3129',
                }}
            >
                <Files
                    files={files}
                    onEditName={(newName, index) => {
                        if (newName) {
                            setFiles([
                                ...files.map((file, idx) => {
                                    if (idx === index) {
                                        return {
                                            ...file,
                                            name: newName,
                                        };
                                    }

                                    return file;
                                }),
                            ]);
                        }
                    }}
                    onSelectFile={(index) => {
                        setCurrentFileIndex(index);
                        setFiles([
                            ...files.map((file, idx) => {
                                return {
                                    ...file,
                                    isSelected: idx === index,
                                };
                            }),
                        ]);
                    }}
                    onAddMore={() => {
                        setCurrentFileIndex(files.length);
                        setFiles([
                            ...files.map((file) => {
                                return {
                                    ...file,
                                    isSelected: false,
                                };
                            }),
                            { name: `untitled-${files.length}.js`, isSelected: true, content: '' }
                        ]);
                    }}
                />
                <AceEditor
                    className={styles.editor}
                    style={{}}
                    width="100%"
                    height="100%"
                    placeholder="// start typing"
                    mode={currentFile.mode}
                    theme="monokai"
                    name="blah2"
                    onChange={onChange}
                    fontSize={20 * scale}
                    showPrintMargin={false}
                    showGutter={true}
                    highlightActiveLine={true}
                    value={currentFile.content}
                    setOptions={{
                        enableBasicAutocompletion: false,
                        enableLiveAutocompletion: false,
                        enableSnippets: false,
                        showLineNumbers: true,
                        tabSize: 2,
                    }}
                />
            </div>
            <div>
                TODO
            </div>
        </div>
    );
}

export default App;
