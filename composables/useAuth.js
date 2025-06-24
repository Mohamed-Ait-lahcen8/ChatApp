import { onAuthStateChanged } from "firebase/auth";
import { auth} from "~/firebase";


export const useAuth = () => {
    const user = useState('user', ()=>null)
    const initAuth = async() => {
        onAuthStateChanged(auth, (Cuser) => {
            if(Cuser) {
                user.value = Cuser
            }
        })
    }
    return {user, initAuth}
}