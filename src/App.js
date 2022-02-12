import AceEditor from "react-ace";
import {Fragment, useCallback, useEffect, useMemo, useState} from "react";

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

const localFiles = JSON.parse(localStorage.getItem('files') || JSON.stringify([{ name: 'untitled.js', isSelected: true, content: '' }]));
const savedIndex = JSON.parse(localStorage.getItem('currentFileIndex') || '0');

function App() {
    const [files, setFiles] = useState(localFiles);
    const [currentFileIndex, setCurrentFileIndex] = useState(savedIndex);
    const [refreshKey, setRefreshKey] = useState(0);
    const initialFiles = JSON.parse(process.env.REACT_APP_INITIAL_FILES || '[]');

    useEffect(() => {
        const checkFiles = async () => {
            if (initialFiles?.length > 0 && !localStorage.getItem('files')) {
                const newFiles = [];
                for (const [index, initialFile] of initialFiles.entries()) {
                    const module = await import('!!raw-loader!./initial_files/' + initialFile);

                    newFiles.push({
                        name: initialFile,
                        isSelected: initialFiles.length === index + 1,
                        content: module.default,
                    });
                }

                setFiles(newFiles);
                setCurrentFileIndex(initialFiles.length - 1);
            }
        }

        checkFiles();
    }, []);

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

    const [rawHtmlContent, functions] = useMemo(() => {
        let rawContent = null;
        const functions = [];

        files.forEach((file) => {
            if (file.name === 'index.html') {
                const doc = new DOMParser().parseFromString(file.content, "text/xml");
                doc.querySelectorAll('script').forEach((script) => {
                    const scriptName = script?.attributes?.src?.nodeValue;
                    if (scriptName) {
                        const file = files.find((file) => {
                            return file.name === scriptName;
                        });
                        functions.push(
                            new Function(file.content)
                        );
                    }
                });
                rawContent = file.content;
            }
        });

        // functions.forEach((f) => {
        //     f();
        // });
        return [rawContent, functions];
    }, [refreshKey]);

    useEffect(() => {
        localStorage.setItem('files', JSON.stringify(files));
        localStorage.setItem('currentFileIndex', JSON.stringify(currentFileIndex));
    }, [currentFileIndex, files]);

    const reCalculateFunctions = () => {
        setRefreshKey(Date.now());
    };

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
                        if (currentFileIndex !== index) {
                            setCurrentFileIndex(index);
                            setFiles([
                                ...files.map((file, idx) => {
                                    return {
                                        ...file,
                                        isSelected: idx === index,
                                    };
                                }),
                            ]);
                        }
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
                    height="calc(100% - 30px)"
                    mode={currentFile.mode}
                    theme="monokai"
                    name="blah2"
                    onChange={onChange}
                    fontSize={16 * scale}
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
            <div
                style={{
                    width: '50%',
                    border: '2px solid #eaebe8',
                }}
            >
                {rawHtmlContent && (
                    <Fragment>
                        <div className={styles['button-wrapper']}>
                            <button
                                className="button"
                                onClick={reCalculateFunctions}
                            >
                                Refresh!
                            </button>
                        </div>
                        <div
                            dangerouslySetInnerHTML={{
                                __html: rawHtmlContent,
                            }}
                        />
                    </Fragment>
                )}
            </div>
        </div>
    );
}

export default App;
