import React from 'react';
import { Route, Switch, useHistory, Redirect } from 'react-router-dom';
import Header from './Header';
import Main from './Main';
import Footer from './Footer';
import EditProfilePopup from './EditProfilePopup';
import ImagePopup from './ImagePopup';
import CurrentUserContext from '../contexts/CurrentUserContext';
import EditAvatarPopup from './EditAvatarPopup';
import AddPlacePopup from './AddPlacePopup';
import DeletePopup from './DeletePopup';
import api from '../utils/api';
import Login from './Login';
import Register from './Register';
import ProtectedRoute from './ProtectedRoute';
import InfoToolTip from './InfoToolTip';

import { authorize, checkToken, register } from '../utils/auth';

export default function App() {

  const [isEditAvatarPopupOpen, setEditAvatarState] = React.useState(false);
  const [isEditProfilePopupOpen, setEditProfileState] = React.useState(false);
  const [isAddPlacePopupOpen, setAddPlaceState] = React.useState(false);
  const [isImagePopupOpen, setImagePopupState] = React.useState(false);
  const [isToolTipPopupOpen, setToolTipPopupOpen] = React.useState(false);
  const [isDeletePopupOpen, setDeletePopupState] = React.useState(false);
  const [selectedCard, setSelectedCard] = React.useState({});
  const [currentUser, setCurrentUser] = React.useState({});
  const [cards, setCards] = React.useState([]);
  const [isAvatarLoading, setAvatarLoading] = React.useState(false);
  const [isUserInfoLoading, setUserInfoLoading] = React.useState(false);
  const [isButtonSubmitLoading, setButtonSubmitLoading] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [userData, setUserData] = React.useState({});
  const [isSuccess, setIsSuccess] = React.useState(false);

  const history = useHistory();

  React.useEffect(() => {
    setAvatarLoading(true);
    setUserInfoLoading(true);
    api.getUserInfo()
      .then((data) => {
        setCurrentUser(data);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setUserInfoLoading(false);
        setAvatarLoading(false);
      })
  }, [])

  React.useEffect(() => {
    api.getCards()
      .then((data) => {
        setCards(data);
      })
      .catch((err) => {
        console.log(err);
      })
  }, [])

  function handleCardClick(card) {
    setSelectedCard(card);
    setImagePopupState(!isImagePopupOpen);
  }

  function handleEditAvatarClick() {
    setEditAvatarState(!isEditAvatarPopupOpen);
  }

  function handleEditProfileClick() {
    setEditProfileState(!isEditProfilePopupOpen);
  }

  function handleAddPlaceClick() {
    setAddPlaceState(!isAddPlacePopupOpen);
  }

  function closeAllPopups() {
    setEditAvatarState(false);
    setEditProfileState(false);
    setAddPlaceState(false);
    setImagePopupState(false);
    setDeletePopupState(false);
    setToolTipPopupOpen(false);
    setSelectedCard({});
  }

  function handleUpdateUser(updatedUserInfo) {
    setButtonSubmitLoading(true);
    setUserInfoLoading(true);
    api.setUserInfo(updatedUserInfo)
      .then((newUserInfo) => {
        setCurrentUser(newUserInfo);
        closeAllPopups();
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setUserInfoLoading(false);
        setButtonSubmitLoading(false);
      })
  }

  function handleUpdateAvatar(updatedAvatar) {
    setAvatarLoading(true);
    setButtonSubmitLoading(true);
    api.setAvatar(updatedAvatar)
      .then((newAvatar) => {
        setCurrentUser(newAvatar);
        closeAllPopups();
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setAvatarLoading(false);
        setButtonSubmitLoading(false);
      })
  }

  function handleCardLike(card) {
    const isLiked = card.likes.some(user => user._id === currentUser._id);

    api.changeLikeCardStatus(isLiked, card._id)
      .then((updateCard) => {
        setCards((cards) => cards.map((c) => (c._id === card._id ? updateCard : c)))
      })
      .catch((err) => {
        console.log(err);
      })
  }

  function handleCardDelete(card) {
    setButtonSubmitLoading(true);
    api.deleteCard(card._id)
      .then(() => {
        setCards((cards) => cards.filter((c) => (c._id !== card._id)))
        closeAllPopups();
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setButtonSubmitLoading(false);
      })
  }

  function handleAddPlace(card) {
    setButtonSubmitLoading(true);
    api.addCard(card)
      .then((newCard) => {
        setCards([newCard, ...cards]);
        closeAllPopups();
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setButtonSubmitLoading(false);
      })
  }

  function handleCardDeleteClick(card) {
    setSelectedCard(card);
    setDeletePopupState(true);
  }

  function handleRegister(data) {
    setButtonSubmitLoading(true);
    register(data)
      .then((res) => {
        if (res) {
          setIsSuccess(true);
          setToolTipPopupOpen(true);
          history.push('/sign-in');
        }
      })
      .catch((err) => {
        setToolTipPopupOpen(true);
        setIsSuccess(false);

        if (err === 400) {
          console.log('некоректно заполено одно из полей');
        }
      })
      .finally(() => {
        setButtonSubmitLoading(false);
      })
  }

  function handleLogin(data) {
    setButtonSubmitLoading(true);
    authorize(data)
      .then((res) => {
        if (res.token) {
          setIsLoggedIn(true);
          setUserData(data);
          localStorage.setItem('jwt', res.token);
          history.push('/');
        }
      })
      .catch((err) => {
        setIsSuccess(false);
        setToolTipPopupOpen(true);
        switch (err) {
          case 400:
            console.log('не передано одно из полей');
            break;
          case 401:
            console.log('пользователь с email не найден');
            break;
          default:
            break;
        }
      })
      .finally(() => {
        setButtonSubmitLoading(false);
      })
  }

  function handleSignOut() {
    localStorage.removeItem('jwt');
    history.push('/sign-in');
    setIsLoggedIn(false);
  }

  React.useEffect(() => {
    const jwt = localStorage.getItem('jwt');
    if(jwt) {
      checkToken(jwt)
      .then((res) => {
        setIsLoggedIn(true);
        setUserData(res.data);
        history.push('/');
      })
      .catch((err) => {
        switch (err) {
          case 400:
            console.log('Токен не передан или передан не в том формате');
            break;
          case 401:
            console.log('Переданный токен некорректен ');
            break;
          default:
            break;
        }
      })
    }
  }, [history]);

  return (
    <CurrentUserContext.Provider value={currentUser}>

      <div className="page">

        <Header 
          userData={userData}
          onSignOut={handleSignOut}
        />

        <Switch>

          <ProtectedRoute exact path='/' isLoggedIn={isLoggedIn}>
            <Main
              onEditProfile={handleEditProfileClick}
              onAddPlace={handleAddPlaceClick}
              onEditAvatar={handleEditAvatarClick}
              onCardClick={handleCardClick}
              onCardLike={handleCardLike}
              onCardDeleteClick={handleCardDeleteClick}
              cards={cards}
              isAvatarLoading={isAvatarLoading}
              isUserInfoLoading={isUserInfoLoading}
            />

            <Footer />
          </ProtectedRoute>

          <Route path='/sign-up'>
            <Register
              onSignUp={handleRegister}
              isSuccess={isSuccess}
              isLoading={isButtonSubmitLoading}
            />
          </Route>

          <Route path='/sign-in'>

            <Login 
              onSignIn={handleLogin}
              isLoggedIn={isLoggedIn}
              isLoading={isButtonSubmitLoading}
            />
          </Route>

          <Route>
            {isLoggedIn ? <Redirect to='/' /> : <Redirect to='/sign-in' />}
          </Route>

        </Switch>

        <EditProfilePopup
          isOpen={isEditProfilePopupOpen}
          onClose={closeAllPopups}
          onUpdateUser={handleUpdateUser}
          isLoading={isButtonSubmitLoading}
        />

        <AddPlacePopup
          isOpen={isAddPlacePopupOpen}
          onClose={closeAllPopups}
          onAddPlace={handleAddPlace}
          isLoading={isButtonSubmitLoading}
        />

        <EditAvatarPopup
          isOpen={isEditAvatarPopupOpen}
          onClose={closeAllPopups}
          onUpdateAvatar={handleUpdateAvatar}
          isLoading={isButtonSubmitLoading}
        />

        <DeletePopup
          isOpen={isDeletePopupOpen}
          onClose={closeAllPopups}
          onDeleteCard={handleCardDelete}
          isLoading={isButtonSubmitLoading}
          selectedCard={selectedCard}
        />

        <ImagePopup
          isOpen={isImagePopupOpen}
          card={selectedCard}
          onClose={closeAllPopups}
        />

        <InfoToolTip
          isOpen={isToolTipPopupOpen}
          isSuccess={isSuccess}
          onClose={closeAllPopups}
        />

      </div>

    </CurrentUserContext.Provider>
  );
}