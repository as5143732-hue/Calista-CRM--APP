import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { normalizePhoneNumber } from '../lib/utils';

/**
 * Migration script to normalize all existing client phone numbers in Firestore.
 * 
 * Usage in a React component:
 * 
 * import { migratePhoneNumbers } from '../scripts/migrate_phones';
 * <button onClick={migratePhoneNumbers}>Run Migration</button>
 */
export async function migratePhoneNumbers() {
  console.log("Starting phone number migration...");
  try {
    const clientsRef = collection(db, 'clients');
    const snapshot = await getDocs(clientsRef);
    let updatedCount = 0;

    for (const clientDoc of snapshot.docs) {
      const data = clientDoc.data();
      if (data.phone) {
        const normalized = normalizePhoneNumber(data.phone);
        if (normalized !== data.phone) {
          console.log(`Updating ${data.phone} -> ${normalized}`);
          await updateDoc(doc(db, 'clients', clientDoc.id), {
            phone: normalized
          });
          updatedCount++;
        }
      }
    }
    console.log(`Migration completed! Updated ${updatedCount} records.`);
    alert(`Migration completed! Updated ${updatedCount} records.`);
  } catch (err) {
    console.error("Migration failed:", err);
    alert("Migration failed. See console for details.");
  }
}
