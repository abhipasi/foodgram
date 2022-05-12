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
img_path='C:/Users/HP/foodogramNode/'+sys.argv[1]

model = load_model('C:/Users/HP/foodogramNode/classification/inceptionv3_multiclass_best.h5')
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
print(prediction)
captionscrawler=pd.read_csv('C:/Users/HP/foodogramNode/classification/captionsfinal.csv')

data1=captionscrawler.loc[captionscrawler.category==prediction].sample(n=5)
cap1=data1.caption.iloc[0]
cap2=data1.caption.iloc[1]
cap3=data1.caption.iloc[2]
cap4=data1.caption.iloc[3]
cap5=data1.caption.iloc[4]
if '<li>' in cap1:
    cap1=cap1.replace("<li>",'')
    cap1=cap1.replace("</li>",'')
if '<li>' in cap2:
    cap2=cap2.replace("<li>",'')
    cap2=cap2.replace("</li>",'')
if '<li>' in cap3:
    cap3=cap3.replace("<li>",'')
    cap3=cap3.replace("</li>",'')
if '<li>' in cap4:
    cap4=cap4.replace("<li>",'')
    cap4=cap4.replace("</li>",'')
if '<li>' in cap5:
    cap5=cap5.replace("<li>",'')
    cap5=cap5.replace("</li>",'')
url=data1.Urls.iloc[0]
print(prediction+'++'+cap1+'++'+cap2+'++'+cap3+'++'+cap4+'++'+cap5+'++'+url)