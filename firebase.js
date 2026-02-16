// ─── Firebase SDK — Focus Club ───────────────────────────
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    GoogleAuthProvider,
    signInWithRedirect,
    getRedirectResult,
    onAuthStateChanged,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    setPersistence,
    browserLocalPersistence
} from 'firebase/auth';
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';

// ─── Config ──────────────────────────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyBvpbEXjSYmI_teLcipWhHuXhh6fQ31re0",
    authDomain: "focus-club-f11fd.firebaseapp.com",
    projectId: "focus-club-f11fd",
    storageBucket: "focus-club-f11fd.firebasestorage.app",
    messagingSenderId: "40722738",
    appId: "1:40722738:web:9c3283223ea029c18c372b",
    measurementId: "G-7JL31HBXDG",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// Ensure persistence (local by default for web, but explicit is safer)
setPersistence(auth, browserLocalPersistence)
    .then(() => {
        // console.log("Firebase persistence enabled");
    })
    .catch((error) => {
        console.error("Firebase persistence error:", error);
    });
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ═════════════════════════════════════════════════════════
//  AUTH: Google
// ═════════════════════════════════════════════════════════

export function loginConGoogle() {
    return signInWithRedirect(auth, googleProvider);
}

export function getResultadoRedirect() {
    return getRedirectResult(auth);
}

// ═════════════════════════════════════════════════════════
//  AUTH: Email / Password
// ═════════════════════════════════════════════════════════

export async function registrarConEmail(email, password, nombre) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (nombre) {
        await updateProfile(cred.user, { displayName: nombre });
    }
    await sincronizarUsuario(cred.user, nombre);
    return cred.user;
}

export async function loginConEmail(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await sincronizarUsuario(cred.user);
    return cred.user;
}

// ═════════════════════════════════════════════════════════
//  AUTH: Sesión
// ═════════════════════════════════════════════════════════

export function onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
}

export function logout() {
    return signOut(auth);
}

export function getUsuarioActual() {
    return auth.currentUser;
}

// ═════════════════════════════════════════════════════════
//  FIRESTORE: Usuarios
// ═════════════════════════════════════════════════════════

/**
 * Sincroniza usuario con Firestore:
 * - NUEVO → crea documento completo con defaults
 * - EXISTENTE → actualiza ultima_conexion
 */
export async function sincronizarUsuario(user, nombreOverride) {
    const ref = doc(db, 'usuarios', user.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
        await updateDoc(ref, {
            ultima_conexion: serverTimestamp(),
        });
    } else {
        await setDoc(ref, {
            uid: user.uid,
            email: user.email,
            nombre: nombreOverride || user.displayName || '',
            avatar: user.photoURL || '',
            rol: 'socio',
            plan_activo: null,
            sesiones_totales: 0,
            sesiones_restantes: 0,
            fecha_renovacion: null,
            fecha_registro: serverTimestamp(),
            ultima_conexion: serverTimestamp(),
        });
    }
}

/** Obtiene el perfil completo del usuario */
export async function getPerfilUsuario(uid) {
    const ref = doc(db, 'usuarios', uid);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Actualiza campos del perfil */
export async function actualizarPerfil(uid, datos) {
    const ref = doc(db, 'usuarios', uid);
    await updateDoc(ref, datos);
}

/** Descuenta una sesión del usuario */
export async function descontarSesion(uid) {
    const perfil = await getPerfilUsuario(uid);
    if (!perfil || perfil.sesiones_restantes <= 0) {
        throw new Error('Sin sesiones disponibles');
    }
    await updateDoc(doc(db, 'usuarios', uid), {
        sesiones_restantes: perfil.sesiones_restantes - 1,
    });
    return perfil.sesiones_restantes - 1;
}

// ═════════════════════════════════════════════════════════
//  FIRESTORE: Entrenadores
// ═════════════════════════════════════════════════════════

/** Obtiene todos los entrenadores activos */
export async function getEntrenadores() {
    const q = query(
        collection(db, 'entrenadores'),
        where('activo', '==', true)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ═════════════════════════════════════════════════════════
//  FIRESTORE: Planes
// ═════════════════════════════════════════════════════════

/** Obtiene todos los planes disponibles */
export async function getPlanes() {
    const snap = await getDocs(collection(db, 'planes'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ═════════════════════════════════════════════════════════
//  FIRESTORE: Reservas
// ═════════════════════════════════════════════════════════

/** Crea una reserva y descuenta sesión */
export async function crearReserva({
    entrenador_id,
    entrenador_nombre,
    fecha_sesion,
    hora,
    nombre_clase,
}) {
    const user = auth.currentUser;
    if (!user) throw new Error('No autenticado');

    // Descontar sesión
    await descontarSesion(user.uid);

    // Crear reserva
    const reserva = await addDoc(collection(db, 'reservas'), {
        uid_usuario: user.uid,
        entrenador_id: entrenador_id || '',
        entrenador_nombre: entrenador_nombre || '',
        fecha_sesion: Timestamp.fromDate(fecha_sesion),
        hora,
        nombre_clase: nombre_clase || 'Entrenamiento',
        fecha_reserva: serverTimestamp(),
        estado: 'confirmada',
    });

    return reserva.id;
}

/** Obtiene las reservas del usuario actual, ordenadas por fecha */
export async function getReservasUsuario() {
    const user = auth.currentUser;
    if (!user) return [];

    const q = query(
        collection(db, 'reservas'),
        where('uid_usuario', '==', user.uid),
        where('estado', '==', 'confirmada'),
        orderBy('fecha_sesion', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Obtiene la próxima reserva futura del usuario */
export async function getProximaReserva() {
    const user = auth.currentUser;
    if (!user) return null;

    const now = Timestamp.now();
    const q = query(
        collection(db, 'reservas'),
        where('uid_usuario', '==', user.uid),
        where('estado', '==', 'confirmada'),
        where('fecha_sesion', '>=', now),
        orderBy('fecha_sesion', 'asc'),
        limit(1)
    );
    const snap = await getDocs(q);
    return snap.docs.length > 0
        ? { id: snap.docs[0].id, ...snap.docs[0].data() }
        : null;
}

/** Cancela una reserva y devuelve la sesión al usuario */
export async function cancelarReserva(reservaId) {
    const user = auth.currentUser;
    if (!user) throw new Error('No autenticado');

    const ref = doc(db, 'reservas', reservaId);
    await updateDoc(ref, { estado: 'cancelada' });

    // Devolver sesión
    const perfil = await getPerfilUsuario(user.uid);
    if (perfil) {
        await updateDoc(doc(db, 'usuarios', user.uid), {
            sesiones_restantes: (perfil.sesiones_restantes || 0) + 1,
        });
    }
}

// ═════════════════════════════════════════════════════════
//  FIRESTORE: Sesiones (legacy — for backward compat)
// ═════════════════════════════════════════════════════════

export async function getSesiones() {
    const q = query(collection(db, 'sesiones'), orderBy('horario', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ═════════════════════════════════════════════════════════
//  SEED: Poblar datos iniciales
// ═════════════════════════════════════════════════════════

/** Puebla entrenadores si la colección está vacía */
export async function seedEntrenadores() {
    try {
        const snap = await getDocs(collection(db, 'entrenadores'));
        if (snap.size > 0) return; // Ya existe data

        const data = [
            {
                nombre: 'Carlos Titan',
                rol: 'Master Trainer',
                especialidades: ['Fuerza', 'Powerlifting'],
                bio: 'Especialista en levantar cosas pesadas. Más de 10 años compitiendo en powerlifting.',
                foto_url: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=400&q=80',
                activo: true,
            },
            {
                nombre: 'Sofia Zen',
                rol: 'Yoga Instructor',
                especialidades: ['Yoga', 'Movilidad'],
                bio: 'Encuentra tu centro y mejora tu flexibilidad. Certificada en Hatha y Vinyasa.',
                foto_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=80',
                activo: true,
            },
            {
                nombre: 'Marco Gloves',
                rol: 'Boxing Coach',
                especialidades: ['Boxeo', 'HIIT'],
                bio: 'Técnica, velocidad y resistencia. Ex-boxeador amateur apasionado por la enseñanza.',
                foto_url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&q=80',
                activo: true,
            },
            {
                nombre: 'Laura Burn',
                rol: 'HIIT Specialist',
                especialidades: ['HIIT', 'Cardio'],
                bio: 'Quema calorías y mejora tu resistencia en tiempo récord. Mis clases son explosivas.',
                foto_url: 'https://images.unsplash.com/photo-1620188467120-5042ed1eb5da?w=400&q=80',
                activo: true,
            },
            {
                nombre: 'David Core',
                rol: 'Functional Trainer',
                especialidades: ['Fuerza', 'Funcional'],
                bio: 'Construye un cuerpo fuerte y útil para el día a día. Enfoque en movimiento natural.',
                foto_url: 'https://images.unsplash.com/photo-1620188467120-5042ed1eb5da?w=400&q=80', // Using similar placeholder, ideally distinct
                activo: true,
            },
        ];

        for (const trainer of data) {
            await addDoc(collection(db, 'entrenadores'), trainer);
        }
        console.log('[Seed] Entrenadores creados');
    } catch (e) {
        console.warn('[Seed] Skipped trainers seeding (likely permissions):', e.message);
    }
}

/** Puebla planes si la colección está vacía */
export async function seedPlanes() {
    try {
        const snap = await getDocs(collection(db, 'planes'));
        if (snap.size > 0) return;

        const data = [
            {
                nombre: 'Plan Básico',
                descripcion: 'Acceso iniciación. Ideal para mantenimiento o técnica puntual. 1 Sesión al mes.',
                precio: 50,
                precio_original: 0,
                sesiones_incluidas: 1,
                popular: false,
                imagen_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
            },
            {
                nombre: 'Plan Élite',
                descripcion: 'Transformación total. 4 sesiones mensuales con seguimiento 1:1, nutrición y métricas.',
                precio: 180,
                precio_original: 200,
                sesiones_incluidas: 4,
                popular: true,
                imagen_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80',
            },
        ];

        for (const plan of data) {
            await addDoc(collection(db, 'planes'), plan);
        }
        console.log('[Seed] Planes creados');
    } catch (e) {
        console.warn('[Seed] Skipped plans seeding (likely permissions):', e.message);
    }
}
