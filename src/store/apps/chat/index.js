// ** Redux Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// ** Axios Imports
import axios from 'axios'

// ** Amplify API
import { API, Amplify, Auth } from 'aws-amplify'

Amplify.configure({
  aws_cognito_identity_pool_id: 'us-east-2:3fe6e06b-4fbf-402a-9f0d-e493cdd8bf3f',
  aws_cognito_region: 'us-east-2',
  aws_user_pools_id: 'us-east-2_FzCOZhgoK',
  aws_user_pools_web_client_id: '53gfqbvg46orh3st0i68o0hvk1',

  API: {
    endpoints: [
      // {
      //   name: "MyAPIGatewayAPI",
      //   endpoint: "https://1234567890-abcdefgh.amazonaws.com"
      // },
      {
        name: 'chatting',
        endpoint: 'https://brihgpfs8g.execute-api.us-east-2.amazonaws.com/staging'
      }
    ]
  }
})

// Function to call the Lambda function
// async function callChatLambdaFunction(myReq) {
//   try {
//     // Make the API call to the Lambda function
//     const response = await API.get('chatting', '/chatendpoint', myReq)
//     console.log('Lambda function response:', response)
//   } catch (error) {
//     console.error('Error calling Lambda function:', error)
//   }
// }

const chatpath = '/chatendpoint'
const chatname = 'chatting'

// ** Fetch User Profile
export const fetchUserProfile = createAsyncThunk('appChat/fetchUserProfile', async () => {
  const response = await axios.get('/apps/chat/users/profile-user')

  return response.data
})

// ** Fetch Chats & Contacts
export const fetchChatsContacts = createAsyncThunk('appChat/fetchChatsContacts', async () => {
  const response = await axios.get('/apps/chat/chats-and-contacts')

  return response.data
})

// ** Select Chat
export const selectChat = createAsyncThunk('appChat/selectChat', async (id, { dispatch }) => {
  const response = await axios.get('/apps/chat/get-chat', {
    params: {
      id
    }
  })
  await dispatch(fetchChatsContacts())

  return response.data
})

// ** Send Msg
export const sendMsg = createAsyncThunk('appChat/sendMsg', async (obj, { dispatch }) => {
  const response = await axios.post('/apps/chat/send-msg', {
    data: {
      obj
    }
  })

  const user = await Auth.currentAuthenticatedUser()
  const token = user.signInUserSession.idToken.jwtToken

  // console.log('token: ', token)

  const myInit = {
    headers: {
      Authorization: token
    } // OPTIONAL
    // response: true, // OPTIONAL (return the entire Axios response object instead of only response.data)
    // queryStringParameters: {
    //   name: 'param' // OPTIONAL
    // }
  }

  try {
    const data = await API.get(chatname, chatpath, myInit)
    console.log('data: ', data)
  } catch (error) {
    console.log('Error calling: ', error)
  }

  if (obj.contact) {
    await dispatch(selectChat(obj.contact.id))
  }
  await dispatch(fetchChatsContacts())

  return response.data
})

export const appChatSlice = createSlice({
  name: 'appChat',
  initialState: {
    chats: null,
    contacts: null,
    userProfile: null,
    selectedChat: null
  },
  reducers: {
    removeSelectedChat: state => {
      state.selectedChat = null
    }
  },
  extraReducers: builder => {
    builder.addCase(fetchUserProfile.fulfilled, (state, action) => {
      state.userProfile = action.payload
    })
    builder.addCase(fetchChatsContacts.fulfilled, (state, action) => {
      state.contacts = action.payload.contacts
      state.chats = action.payload.chatsContacts
    })
    builder.addCase(selectChat.fulfilled, (state, action) => {
      state.selectedChat = action.payload
    })
  }
})

export const { removeSelectedChat } = appChatSlice.actions

export default appChatSlice.reducer
