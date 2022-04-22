// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
// import { getAnalytics } from 'firebase/analytics';
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
} from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: 'AIzaSyDZbsYnhDAV0SWjJw2e81ShRNuNRbz4-iQ',
    authDomain: 'physical-therapy-system.firebaseapp.com',
    projectId: 'physical-therapy-system',
    storageBucket: 'physical-therapy-system.appspot.com',
    messagingSenderId: '411714019674',
    appId: '1:411714019674:web:669257e2726581c3525363',
    measurementId: 'G-93J05VGEJN',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const db = getFirestore(app);

export const usersRef = collection(db, 'users');
export const recordsRef = collection(db, 'records');
export const difficultiesRef = collection(db, 'difficulties');

export const validateInputPairId = async (pairId) => {
    const q = query(recordsRef, where('pairId', '==', pairId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty || querySnapshot.size != 1) {
        return false;
    }

    let record;
    let recordId;
    querySnapshot.forEach((doc) => {
        record = doc.data();
        recordId = doc.id;
    });

    if (record?.finishedWorkoutTime != null) {
        return false;
    }

    return recordId;
};

export const getRpmsWithPairdId = async (pairId) => {
    let targetRecordId = null;

    const q = query(recordsRef, where('pairId', '==', pairId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }
    if (querySnapshot.size == 1) {
        querySnapshot.forEach((doc) => {
            targetRecordId = doc.id;
        });
    }
    console.log(targetRecordId);
    return collection(recordsRef, targetRecordId, 'rpms');
};

export const generateValidPairId = async () => {
    let pass = false;
    let pairId = null;

    while (!pass) {
        const test = getRandomPairId();
        const validated = await isPairIdValid(test);

        if (validated) {
            pass = true;
            pairId = test;
        }
    }

    return pairId;
};

const isPairIdValid = async (pairId) => {
    const q = query(recordsRef, where('pairId', '==', pairId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return true;
    } else return false;
};

const getRandomPairId = () => {
    return Math.floor(Math.random() * (9999 - 1000) + 1000).toString();
};
