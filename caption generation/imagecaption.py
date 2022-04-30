import pandas as pd
import numpy as np
import tensorflow as tf
import sys
import collections
import random
df_caption=pd.read_csv('caption generation/captioneddata_final.csv') 
df_caption=df_caption.loc[df_caption['label']=='food']
df_caption = df_caption[df_caption['photo_id']!="LXT4hCf1lRyUeM4HDBaSvg"]
image_path_to_caption = collections.defaultdict(list)
for ind in df_caption.index:
    caption = "<start> "+ str(df_caption['cleaned_caption'][ind])+" <end> "
    image_path ='foodphotos/' + (df_caption['photo_id'][ind])+'.jpg'
    image_path_to_caption[image_path].append(caption)
image_paths = list(image_path_to_caption.keys())
random.shuffle(image_paths)
train_image_paths = image_paths
train_captions = []
img_name_vector = []
for image_path in train_image_paths:
    caption_list = image_path_to_caption[image_path]
    train_captions.extend(caption_list)
    img_name_vector.extend([image_path] * len(caption_list))
image_model = tf.keras.applications.InceptionV3(include_top=False,weights='imagenet')
new_input = image_model.input
hidden_layer = image_model.layers[-1].output
image_features_extract_model = tf.keras.Model(new_input, hidden_layer)
def calc_max_length(tensor):
    return max(len(t) for t in tensor)
top_k = 6000
tokenizer = tf.keras.preprocessing.text.Tokenizer(num_words=top_k,oov_token="<unk>",filters='!"#$%&()*+.,-/:;=?@[\]^_`{|}~ ')
tokenizer.fit_on_texts(train_captions)
train_seqs = tokenizer.texts_to_sequences(train_captions)
tokenizer.word_index['<pad>'] = 0
tokenizer.index_word[0] = '<pad>'
train_seqs = tokenizer.texts_to_sequences(train_captions)
cap_vector = tf.keras.preprocessing.sequence.pad_sequences(train_seqs, padding='post')
max_length = calc_max_length(train_seqs)
features_shape = 2048
attention_features_shape = 64
BATCH_SIZE = 64
BUFFER_SIZE = 1000
embedding_dim = 256
units = 512
vocab_size = top_k + 1

class BahdanauAttention(tf.keras.Model):
    def __init__(self, units):
        super(BahdanauAttention, self).__init__()
        self.W1 = tf.keras.layers.Dense(units)
        self.W2 = tf.keras.layers.Dense(units)
        self.V = tf.keras.layers.Dense(1)

    def call(self, features, hidden):
        hidden_with_time_axis = tf.expand_dims(hidden, 1)
        attention_hidden_layer = (tf.nn.tanh(self.W1(features) +self.W2(hidden_with_time_axis)))
        score = self.V(attention_hidden_layer)
        attention_weights = tf.nn.softmax(score, axis=1)
        context_vector = attention_weights * features
        context_vector = tf.reduce_sum(context_vector, axis=1)
        return context_vector, attention_weights

class CNN_Encoder(tf.keras.Model):
    def __init__(self, embedding_dim):
        super(CNN_Encoder, self).__init__()
        self.fc = tf.keras.layers.Dense(embedding_dim)

    def call(self, x):
        x = self.fc(x)
        x = tf.nn.relu(x)
        return x

class RNN_Decoder(tf.keras.Model):
    def __init__(self, embedding_dim, units, vocab_size):
        super(RNN_Decoder, self).__init__()
        self.units = units

        self.embedding = tf.keras.layers.Embedding(vocab_size, embedding_dim)
        self.gru = tf.keras.layers.GRU(self.units,return_sequences=True,return_state=True,recurrent_initializer='glorot_uniform')
        self.fc1 = tf.keras.layers.Dense(self.units)
        self.fc2 = tf.keras.layers.Dense(vocab_size)
        self.attention = BahdanauAttention(self.units)

    def call(self, x, features, hidden):
        context_vector, attention_weights = self.attention(features, hidden)
        x = self.embedding(x)
        x = tf.concat([tf.expand_dims(context_vector, 1), x], axis=-1)
        output, state = self.gru(x)
        x = self.fc1(output)
        x = tf.reshape(x, (-1, x.shape[2]))
        x = self.fc2(x)
        return x, state, attention_weights

    def reset_state(self, batch_size):
        return tf.zeros((batch_size, self.units))

encoder = CNN_Encoder(embedding_dim)
decoder = RNN_Decoder(embedding_dim, units, vocab_size)

optimizer = tf.keras.optimizers.Adam()
loss_object = tf.keras.losses.SparseCategoricalCrossentropy(
    from_logits=True, reduction='none')

def loss_function(real, pred):
    mask = tf.math.logical_not(tf.math.equal(real, 0))
    loss_ = loss_object(real, pred)
    mask = tf.cast(mask, dtype=loss_.dtype)
    loss_ *= mask
    return tf.reduce_mean(loss_)
checkpoint_path = "./caption generation/checkpoints/finaltrain"
ckpt = tf.train.Checkpoint(encoder=encoder,decoder=decoder,optimizer = optimizer)
ckpt_manager = tf.train.CheckpointManager(ckpt, checkpoint_path, max_to_keep=5)
start_epoch = 0
if ckpt_manager.latest_checkpoint:
    start_epoch = int(ckpt_manager.latest_checkpoint.split('-')[-1])
    ckpt.restore(ckpt_manager.latest_checkpoint)
def evaluate(image):
    attention_plot = np.zeros((max_length, attention_features_shape))
    hidden = decoder.reset_state(batch_size=1)
    temp_input = tf.expand_dims(load_image(image)[0], 0)
    img_tensor_val = image_features_extract_model(temp_input)
    img_tensor_val = tf.reshape(img_tensor_val, (img_tensor_val.shape[0], -1, img_tensor_val.shape[3]))
    features = encoder(img_tensor_val)
    dec_input = tf.expand_dims([tokenizer.word_index['<start>']], 0)
    result = []
    for i in range(max_length):
        predictions, hidden, attention_weights = decoder(dec_input, features, hidden)
        attention_plot[i] = tf.reshape(attention_weights, (-1, )).numpy()
        predicted_id = tf.random.categorical(predictions, 1)[0][0].numpy()
        result.append(tokenizer.index_word[predicted_id])
        if tokenizer.index_word[predicted_id] == '<end>':
            return result
        dec_input = tf.expand_dims([predicted_id], 0)
    return result
testimage_path=image_file=sys.argv[1]
testcaption=''
testimage_path_to_caption = collections.defaultdict(list)
testimage_path_to_caption[testimage_path].append(testcaption)
testimage_paths = list(testimage_path_to_caption.keys())
etest_image_paths = testimage_paths
etest_captions = []
etimg_name_vector = []
for timage_path in etest_image_paths:
    testcaption_list = testimage_path_to_caption[timage_path]
    etest_captions.extend(testcaption_list)
    etimg_name_vector.extend([timage_path] * len(testcaption_list))
def load_image(timage_path):
    img = tf.io.read_file(timage_path)
    img = tf.image.decode_jpeg(img, channels=3)
    img = tf.image.resize(img, (299, 299))
    img = tf.keras.applications.inception_v3.preprocess_input(img)
    return img, timage_path
eencode_test = sorted(set(etimg_name_vector))
testimage_dataset = tf.data.Dataset.from_tensor_slices(eencode_test)
testimage_dataset = testimage_dataset.map(load_image, num_parallel_calls=tf.data.experimental.AUTOTUNE).batch(16)
for img, path in (testimage_dataset):
    batch_features = image_features_extract_model(img)
    batch_features = tf.reshape(batch_features,(batch_features.shape[0], -1, batch_features.shape[3]))
    for bf, p in zip(batch_features, path):
        path_of_feature = p.numpy().decode("utf-8")
        np.save(path_of_feature, bf.numpy())
tokenizer.fit_on_texts(etest_captions)
etest_seqs = tokenizer.texts_to_sequences(etest_captions)
etcap_vector = tf.keras.preprocessing.sequence.pad_sequences(etest_seqs, padding='post')
def calc_max_length(tensor):
    return max(len(t) for t in tensor)
etmax_length = calc_max_length(etest_seqs)
etimg_to_cap_vector = collections.defaultdict(list)
for img, cap in zip(etimg_name_vector, etcap_vector):
    etimg_to_cap_vector[img].append(cap)
etimg_keys = list(etimg_to_cap_vector.keys())
etimg_name_test_keys = etimg_keys
etimg_name_test = []
ecap_test = []
for imgt in etimg_name_test_keys:
    capt_len = len(etimg_to_cap_vector[imgt])
    etimg_name_test.extend([imgt] * capt_len)
    ecap_test.extend(etimg_to_cap_vector[imgt])
im = etimg_name_test[0]
result= evaluate(im)
print (''.join(result))

