// ** React Imports
import { createContext, useEffect, useState } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

// ** Axios
import axios from 'axios'

// ** Config
import authConfig from 'src/configs/auth'

// ** Amplify Auth API
import { Auth, Amplify } from 'aws-amplify'

Amplify.configure({
  aws_cognito_identity_pool_id: 'us-east-2:3fe6e06b-4fbf-402a-9f0d-e493cdd8bf3f',
  aws_cognito_region: 'us-east-2',
  aws_user_pools_id: 'us-east-2_FzCOZhgoK',
  aws_user_pools_web_client_id: '53gfqbvg46orh3st0i68o0hvk1'
})

// ** Defaults
const defaultProvider = {
  user: null,
  loading: true,
  setUser: () => null,
  setLoading: () => Boolean,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  register: () => Promise.resolve(),
  confirm: () => Promise.resolve()
}
const AuthContext = createContext(defaultProvider)

const AuthProvider = ({ children }) => {
  // ** States
  const [user, setUser] = useState(defaultProvider.user)
  const [loading, setLoading] = useState(defaultProvider.loading)

  // ** Hooks
  const router = useRouter()

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
      if (storedToken) {
        setLoading(true)
        await axios
          .get(authConfig.meEndpoint, {
            headers: {
              Authorization: storedToken
            }
          })
          .then(async response => {
            setLoading(false)
            setUser({ ...response.data.userData })
          })
          .catch(() => {
            localStorage.removeItem('userData')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('accessToken')
            setUser(null)
            setLoading(false)
            if (authConfig.onTokenExpiration === 'logout' && !router.pathname.includes('login')) {
              router.replace('/login')
            }
          })
      } else {
        setLoading(false)
      }
    }
    initAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogin = (params, errorCallback) => {
    // axios
    //   .post(authConfig.loginEndpoint, params)
    //   .then(async response => {
    //     params.rememberMe
    //       ? window.localStorage.setItem(authConfig.storageTokenKeyName, response.data.accessToken)
    //       : null
    //     const returnUrl = router.query.returnUrl
    //     setUser({ ...response.data.userData })
    //     params.rememberMe ? window.localStorage.setItem('userData', JSON.stringify(response.data.userData)) : null
    //     const redirectURL = returnUrl && returnUrl !== '/' ? returnUrl : '/'
    //     router.replace(redirectURL)
    //   })
    //   .catch(err => {
    //     if (errorCallback) errorCallback(err)
    //   })

    const ava = async () => {
      try {
        const user = await Auth.signIn(params.email, params.password)

        // console.log(user)
        params.rememberMe ? window.localStorage.setItem(authConfig.storageTokenKeyName, 'accessToken') : null
        const returnUrl = router.query.returnUrl
        setUser({ user })

        const userData = {
          //...user,
          id: 1,
          role: 'admin',
          password: undefined,
          fullName: 'User Name',
          username: 'username',
          email: 'admin@materialize.com'
        }
        setUser({ ...userData })
        params.rememberMe ? window.localStorage.setItem('userData', JSON.stringify(userData)) : null
        const redirectURL = '/dashboards/crm/'
        router.replace(redirectURL)
      } catch (error) {
        //if (errorCallback) errorCallback(error)
        console.log('signIn err, ', error)
        if (errorCallback) errorCallback()
      }
    }

    ava()
  }

  const handleLogout = () => {
    setUser(null)
    window.localStorage.removeItem('userData')
    window.localStorage.removeItem(authConfig.storageTokenKeyName)
    router.push('/login')

    const ava = async () => {
      try {
        await Auth.signOut()
      } catch (error) {
        console.log('error signing out: ', error)
      }
    }

    ava()
  }

  const handleRegister = (params, errorCallback) => {
    // axios
    //   .post(authConfig.registerEndpoint, params)
    //   .then(res => {
    //     if (res.data.error) {
    //       if (errorCallback) errorCallback(res.data.error)
    //     } else {
    //       handleLogin({ email: params.email, password: params.password })
    //     }
    //   })
    //   .catch(err => (errorCallback ? errorCallback(err) : null))

    const { email, username, password } = params

    const ava = async () => {
      try {
        const { user } = await Auth.signUp({
          username,
          password,
          attributes: {
            email // optional
          },
          autoSignIn: {
            // optional - enables auto sign in after user is confirmed
            enabled: true
          }
        })
        console.log(user)
      } catch (error) {
        console.log('error signing up:', error)
        if (errorCallback) errorCallback(error)

        return
      }
      console.log('Need to confirm register with code sent to email')

      //handleLogin({ email, password })
    }
    ava()
  }

  const handleConfirm = params => {
    const { username, code } = params

    const ava = async () => {
      try {
        await Auth.confirmSignUp(username, code)
      } catch (error) {
        console.log('error confirming sign up', error)
      }
    }
    ava()
  }

  const values = {
    user,
    loading,
    setUser,
    setLoading,
    login: handleLogin,
    logout: handleLogout,
    register: handleRegister,
    confirm: handleConfirm
  }

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider }
