import React, {useEffect} from 'react';
import './App.css';
import * as Tone from 'tone'
import {Sequence} from "tone";

type Scale = string[]
const scaleDegrees: Scale = [
    "C",
    "Db",
    "D",
    "Eb",
    "E",
    "F",
    "Gb",
    "G",
    "Ab",
    "A",
    "Bb",
    "B"
]

type RawScale = number[]

const timeSignature = [4, 4] // use in Tone.Time
const convertListOfNumbersToScale = (sourceListOfNumbers: RawScale): Scale => {
    const newScaleObject: { [key: string]: string } = {};

    for (let i = 0; i < sourceListOfNumbers.length; i++) {
        const degree: number = sourceListOfNumbers[i];
        const note: string = scaleDegrees[degree];
        // add note to new scale object
        newScaleObject[note] = note;
    }

    // order scale object by key
    const orderedScaleObject = Object.keys(newScaleObject).sort(
        (a, b) => {
            return scaleDegrees.indexOf(a) - scaleDegrees.indexOf(b);
        }
    ).reduce(
        (obj: { [key: string]: string }, key) => {
            obj[key] = newScaleObject[key];
            return obj;
        }
        , {});
    return Object.keys(orderedScaleObject).length > 0 ? Object.keys(orderedScaleObject) : [scaleDegrees[0]];
}


function App() {

    const [scale, setScale] = React.useState<Scale>([])
    const [isPlaying, setIsPlaying] = React.useState<boolean>(false)
    const [isEnabled, setIsEnabled] = React.useState<boolean>(false)
    const [sequence, setSequence] = React.useState<Sequence>(new Tone.Sequence)
    const [ipAddress, setIpAddress] = React.useState<string>("")
    const [currentlyPlayingNote, setCurrentlyPlayingNote] = React.useState<number>(0)

    const enableAudio = () => {
        console.log(new AudioContext());
        Tone.start().catch((error) => {
            console.log(error)
        }).then(() => {
            console.log("audio enabled")
        });
        setIsPlaying(true);
    }

    const playSequence = () => {
        Tone.Transport.stop();
        const synth = new Tone.Synth(
            {
                oscillator: {
                    type: "sine"
                },
                envelope: {
                    attack: 0.01,
                },
                volume: -5,
            }
        ).toDestination();


        const newSequence: Sequence = new Tone.Sequence(
            (time, note) => {
                synth.portamento = 0.01;
                synth.oscillator.type = "sine";
                synth.triggerAttackRelease(note, "8n", time);
            },
            scale.map((note, index) => {
                // return random note
                const randomNote = scale[Math.floor(Math.random() * scale.length)];
                const randomnessRange = 3;
                const randomOctave = Math.floor(Math.random() * randomnessRange) + 4;
                setCurrentlyPlayingNote(scaleDegrees.indexOf(randomNote))
                return randomNote + randomOctave;
            }),
            "8n",
        ).start();
        setSequence(newSequence)
        // every subdivision, console log the note

        Tone.Transport.start();

        // when a note is played, set the currently playing note
        // setCurrentlyPlayingNote(newSequence.progress * scale.length)

        setIsPlaying(true)
    }

    const stopSequence = () => {
        Tone.Transport.stop();
        sequence.clear()
        setIsPlaying(false);
    }

    const playNote = (note: string) => {
        const synth = new Tone.Synth(
            {
                oscillator: {
                    type: "sine"
                },
                envelope: {
                    attack: 0.01,
                },
                context: Tone.context
            }
        ).toDestination();
        console.log(note)
        let octave = 4;
        synth.triggerAttackRelease(note + '4', "8n");
    }

    useEffect(() => {
        // get ip address of user
        fetch('https://api.ipify.org?format=json')
            .then(response => response.json())
            .then(data => {
                const userIpAddress = data.ip;
                setIpAddress(userIpAddress)
                // convert ip address into a list of numbers
                const listOfNumberChunks = userIpAddress.split(".").map((digit: string) => {
                    return parseInt(digit);
                });
                const listOfNumbers = listOfNumberChunks.reduce((acc: number[], curr: number) => {
                    const currNumberAsString = curr.toString();
                    const digitsOfCurrentNumber = currNumberAsString.split("").map((digit: string) => {
                        return parseInt(digit);
                    });
                    return [...acc, ...digitsOfCurrentNumber]
                }, []);

                console.log(listOfNumbers)
                let userScale = convertListOfNumbersToScale(listOfNumbers);
                setScale(userScale);
            })
            .catch(error => console.log(error));
    }, [])


    return (
        <div className="App">
            {/*Create a play button*/}
            <header className="App-header">
                <h1>Random Music Generator</h1>
                <h2>Based on your IP address: {
                    <div style={{background: isPlaying === true ? "none" : "none", borderRadius: "50px"}}>{
                        ipAddress.split('').map((digit: string, index: number) => {
                            return (
                                <span key={index}
                                      style={{color: currentlyPlayingNote === index ? "gray" : "gray"}}>{digit}</span>
                            )
                        })}</div>
                }</h2>
                <p>Click the play button to generate a random sequence of notes.
                    <br/>The scale is determined by the digits in your IP address.</p>
                {/*<button onClick={enableAudio}>Enable Audio</button>*/}
                {!isPlaying ?
                    <button style={{...buttonStyle, backgroundColor: "green"}} onClick={playSequence}>Play</button> :
                    <button style={{
                        backgroundColor: "red"
                        , ...buttonStyle
                    }} onClick={stopSequence}>Stop</button>}
                <div className="grid-container" style={{height: 200, flexDirection: "row"}}>
                    {
                        Array.from(scale).map((note) => {
                            return (
                                <button className="grid-item" style={{width: "200px", height: "200px"}} key={note}
                                        onMouseOver={() => {
                                            playNote(note)
                                        }}>
                                    {note}
                                </button>
                            )
                        })
                    }
                </div>
            </header>
        </div>
    );
}

export default App;


const buttonStyle = {
    width: "200px",
    height: "200px",
    color: "white",
    border: "none",
    borderRadius: "5px",
    fontSize: "1.5rem",
    fontWeight: "bold",
    cursor: "pointer",
    outline: "none",
    margin: "10px",
    padding: "10px",
    boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.2)"

}