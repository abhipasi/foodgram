import numpy as np
from keras.models import load_model
import tensorflow as tf
from keras.preprocessing import image
import sys
import pandas as pd
INIT_LR = 1e-6
IMG_WIDTH, IMG_HEIGHT = 299, 299 
label={0: 'Bread', 1: 'Dairy product', 2: 'Dessert', 3: 'Egg', 4: 'Fried food', 5: 'Meat', 6: 'Noodles-Pasta', 7: 'Rice', 
       8: 'Seafood', 9: 'Soup', 10: 'Vegetable-Fruit'}
img_path=sys.argv[1]
model = load_model('C:/Users/shrujal/OneDrive/Desktop/foodogramNode/classification/inceptionv3_multiclass_best.h5')
model.compile(optimizer=tf.keras.optimizers.Adam(lr=INIT_LR), loss='categorical_crossentropy', metrics=['categorical_accuracy'])
def load_image(img_path):
    img = image.load_img(img_path, target_size=(299, 299))
    img_tensor = image.img_to_array(img)                    
    img_tensor = np.expand_dims(img_tensor, axis=0)         
    img_tensor /= 255.                                      
    return img_tensor
new_image = load_image(img_path)
pred = model.predict(new_image)
prediction=label[np.argmax(pred)]
captionscrawler=pd.read_csv('C:/Users/shrujal/OneDrive/Desktop/foodogramNode/classification/crawledcaptionsfinal.csv')
print(prediction+'++'+captionscrawler.caption.loc[captionscrawler.category==prediction].sample(n=1).to_string(header=False, index=False))