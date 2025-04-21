import torch
import os
import cv2
import matplotlib.pyplot as plt


def get_cuda_device() -> torch.device:
    print("Listing all available CUDA devices:")

    for i in range(torch.cuda.device_count()):
        print(f"Device {i}: {torch.cuda.get_device_name(i)}")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    print(device)

    return device


def plot_sample_imgs(labels, train_path, num_imgs=7):
    fig, axs = plt.subplots(len(labels), num_imgs + 1, figsize=(13, 12))

    for i, label in enumerate(labels):
        axs[i, 0].axis("off")
        axs[i, 0].text(0.5, 0.5, labels[i], va="center", ha="center")
        path_label = os.path.join(train_path, label)
        files = os.listdir(path_label)

        for j_imgs in range(1, num_imgs + 1):
            axs[i, j_imgs].axis("off")
            single_image_path = os.path.join(path_label, files[j_imgs])
            single_image = cv2.imread(single_image_path)
            single_image = cv2.cvtColor(single_image, cv2.COLOR_BGR2RGB)
            axs[i, j_imgs].imshow(single_image)
