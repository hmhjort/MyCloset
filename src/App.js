import './App.css';
import { useEffect, useState } from 'react';
import { auth, db } from './firebase.js';
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { BrowserRouter as Router, Link, Route, Routes, useNavigate } from "react-router-dom";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); 

  function signUpUser (e) {
    e.preventDefault();
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        navigate("/login");
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
        setErrorMessage(errorMessage);
      });

  }
  return (
    <div id="sign-up-page">
      <div id="my-closet-title">My Closet</div>
      <form>
        <header className="Log-in">Sign Up</header>
        <label htmlFor="email">Email: </label>
        <input value={email}
          type="email" id="email" name="email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <label htmlFor="password">Password: </label>
        <input value={password}
          type="password" id="password" name="password"
          onChange={(e) => setPassword(e.target.value)}
        />
        {errorMessage && <p className="error">{errorMessage}</p>}
        <button id="sign-up-button" type="submit" onClick={signUpUser}>
          Sign up
        </button>
      </form>
    </div>
  );
}

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function loginUser(e) {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        navigate("/")
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
        setErrorMessage(errorMessage);
    });
  }
  return (
    <div id="log-in-page">
      <div id="my-closet-title"> My Closet </div>
      <form>
        <header className="Log-in">Log in</header>
        <label htmlFor="email">Email: </label>
        <input value={email}
          type="email" id="email" name="email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <label htmlFor="password">Password: </label>
        <input value={password}
          type="password" id="password" name="password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button id="log-in-button" type="submit" onClick={loginUser}>
          Log in
        </button>
        {errorMessage && <p className="error">{errorMessage}</p>}
        <p> New user? Sign up <Link to="/signUp">here</Link></p>
      </form>
    </div>
  );
}

function Header({ toggleMyAccountFormVisibility, showMyAccountForm, user }) {
  return (
    <header className="App-header">
      <div id="Account">
        <button id="View-Account" onClick={toggleMyAccountFormVisibility}>
          My Account
        </button>
        {showMyAccountForm && (
          <MyAccount 
            onClose={toggleMyAccountFormVisibility} 
            user={user}
          />
        )}
      </div>
      <div id="MyCloset">My Closet</div>
    </header>
  );
}

function Sidebar({items, selectedItems, onSelectItem, showAddItemForm, toggleAddItemFormVisibility, handleAddItem, categories}) {
  return (
    <div id="Sidebar">
      <div id="Clothes">Clothes</div>
      <Checklist 
        items={items} 
        onSelectItem={onSelectItem}
        categories={categories}
        selectedItems={selectedItems}
      />
      <button id="Add" onClick={toggleAddItemFormVisibility}>
        <div id="Plus">➕</div>
        <div id="Add-Item">Add Item</div>
      </button>
      {showAddItemForm && (
        <AddItemForm
          onAddItem={handleAddItem}
          onClose={toggleAddItemFormVisibility}
          categories={categories}
        />
      )}
    </div>
  );
}

function MyAccount({ onClose, user }) {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    signOutUser();
    navigate("/login");
  };

  function signOutUser() {
    signOut(auth).then(() => {
    }).catch((error) => {
      console.error("Error");
    });
  }

  return (
    <>
      <div id="Overlay" onClick={onClose}></div>
      <form onSubmit={handleSubmit} id="AccountForm">
        <header className="your-account">Account: {user.email} </header>
        <button id="sign-out-button" type="submit">
          Sign Out
        </button>
      </form>
    </>
  );
}

function SelectedItemDisplay({ selectedItems, categories }) {
  return (
    <div id="Closet">
      {categories.map((category) => {
        const item = selectedItems[category];
        return (
          <div key={category} id={category}>
            <p id={`label-${category}`} >{category}</p>
            {item && item.imageUrl ? (
              <img id={`Image-${category}`} src={item.imageUrl} alt={`Selected ${category}`} />
            ) : (
              <p id="Select-one">Select one of the {category}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AddItemForm({ onAddItem, onClose }) {
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    let uploadedImageUrl = "";
    if (image) {
      const storageRef = ref(getStorage(), `images/${image.name}`);
      try {
        const uploadSnapshot = await uploadBytes(storageRef, image);
        uploadedImageUrl = await getDownloadURL(uploadSnapshot.ref);
      } catch (error) {
        console.error("Error uploading image: ", error);
        alert("Error uploading image.");
        return;
      }
    }

    const newItem = {
      title: itemName,
      content: description,
      category,
      imageUrl: uploadedImageUrl || "",
    };

    onAddItem(newItem);
    setItemName("");
    setDescription("");
    setCategory("");
    setImage(null);
    onClose();
  };

  return (
    <>
      <div id="Overlay" onClick={onClose}></div>
      <form onSubmit={handleSubmit} id="AddItemForm">
        <header className="new-item">New Item</header>
        <label htmlFor="itemName">Name:</label>
        <input
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          id="itemName"
          name="itemName"
          required
        />
        <label htmlFor="description">Description:</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          id="description"
          name="description"
          required
        />
        <label htmlFor="category">Category:</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          id="category"
          name="category"
          required
        >
          <option value="" disabled>
            Select a category
          </option>
          <option value="Tops">Tops</option>
          <option value="Bottoms">Bottoms</option>
          <option value="Coats">Coats</option>
          <option value="Shoes">Shoes</option>
          <option value="Accessories">Accessories</option>
        </select>

        <label htmlFor="image">Upload Image:</label>
        <input
          type="file"
          accept="image/*"
          id="image"
          name="image"
          onChange={handleImageChange}
        />
        {image && <img src={URL.createObjectURL(image)} alt="Preview" id="Preview"/>}
        <button id="save-item-button" type="submit">
          Add Item
        </button>
      </form>
    </>
  );
}


function Checklist({ items, onSelectItem, categories, selectedItems }) {
  const [openCategories, setOpenCategories] = useState({});

  const groupedItems = categories.reduce((acc, category) => {
    acc[category] = items.filter((item) => item.category === category);
    return acc;
  }, {});

  const toggleCategory = (category) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  }

  return (
    <div id="Checklist">
      {categories.map((category) => (
        <div key={category} className="category-section">
          <div
            className="category-header"
            onClick={() => toggleCategory(category)}
          >
            <span>{category}</span>
            <span>{openCategories[category] ? "▲" : "▼"}</span>
          </div>

          {openCategories[category] && (
            <div className="category-items">
              {groupedItems[category].length > 0 ? (
                groupedItems[category].map((item) => (
                  <div key={item.id} className="item-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedItems[category]?.id === item.id}
                        onChange={(e) => {
                          e.stopPropagation();
                          onSelectItem(item);
                        }}
                      />
                      <span>{item.title} - {item.content}</span>
                    </label>
                  </div>
                ))
              ) : (
                <p id="No-items">No items in this category.</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


function Home() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [showMyAccountForm, setShowMyAccountForm] = useState(false);
  const categories = ["Tops", "Bottoms", "Accessories", "Coats", "Shoes"];
  const [selectedItems, setSelectedItems] = useState(
    categories.reduce((acc, category) => {
      acc[category] = null; 
      return acc;
    }, {})
  );

  useEffect(()=>{
    onAuthStateChanged(auth, (user) => {
        if (user) {
          setUser(user);
        } else {
          setUser(null);
          navigate("/login");
        }
      });
  }, [navigate])

  useEffect(() => {
    async function getItemsFromDb() {
      try {
        const q = query(collection(db, "items"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const fetchedItems = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          completed: doc.data().completed || false, 
        }));
        setItems(fetchedItems);
      } catch (e) {
        console.error("Error fetching Items: ", e);
      }
    }
    if (user) {
      getItemsFromDb();
    }
  }, [user]);

  const handleAddItem = async (newItem) => {
    if (user) {
      try {
        const itemRef = await addDoc(collection(db, "items"), {
          userId: user.uid,
          ...newItem,
        });
        setItems((prevItems) => [
          ...prevItems,
          { id: itemRef.id, userId: user.uid, ...newItem },
        ]);
        setShowAddItemForm(false);
      } catch (e) {
        console.error("Error adding item: ", e);
      }
    }
  };

  const toggleAddItemFormVisibility = () => {
    setShowAddItemForm((prev) => !prev);
  }

  const toggleMyAccountFormVisibility = () => {
    setShowMyAccountForm((prev) => !prev);
  }

  const handleSelectItem = (item) => {
    setSelectedItems((prevSelected) => ({
      ...prevSelected,
      [item.category]: item,
    }));
  }

  return (
    <div className="App">
      <Header
        toggleMyAccountFormVisibility={toggleMyAccountFormVisibility}
        showMyAccountForm={showMyAccountForm}
        user={user}
      />
      <main id="Main">
        <SelectedItemDisplay selectedItems={selectedItems} categories={categories}/>
        <Sidebar 
          items={items}
          onSelectItem={handleSelectItem}
          showAddItemForm={showAddItemForm}
          toggleAddItemFormVisibility={toggleAddItemFormVisibility}
          handleAddItem={handleAddItem}
          categories={categories}
          selectedItems={selectedItems}
        />
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/signup" element={<Signup/>}/>
      </Routes>
    </Router>
  );
}

export default App;

