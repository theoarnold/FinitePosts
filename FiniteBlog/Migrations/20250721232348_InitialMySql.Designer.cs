﻿// <auto-generated />
using System;
using FiniteBlog.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

#nullable disable

namespace FiniteBlog.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20250721232348_InitialMySql")]
    partial class InitialMySql
    {
        /// <inheritdoc />
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "9.0.0")
                .HasAnnotation("Relational:MaxIdentifierLength", 64);

            MySqlModelBuilderExtensions.AutoIncrementColumns(modelBuilder);

            modelBuilder.Entity("FiniteBlog.Models.AnonymousPost", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("char(36)");

                    b.Property<string>("AttachedFileContentType")
                        .HasColumnType("longtext");

                    b.Property<string>("AttachedFileName")
                        .HasColumnType("longtext");

                    b.Property<long?>("AttachedFileSizeBytes")
                        .HasColumnType("bigint");

                    b.Property<string>("AttachedFileUrl")
                        .HasColumnType("longtext");

                    b.Property<string>("Content")
                        .IsRequired()
                        .HasColumnType("longtext");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("datetime(6)");

                    b.Property<int>("CurrentViews")
                        .HasColumnType("int");

                    b.Property<string>("Slug")
                        .IsRequired()
                        .HasColumnType("longtext");

                    b.Property<int>("ViewLimit")
                        .HasColumnType("int");

                    b.HasKey("Id");

                    b.ToTable("AnonymousPosts");
                });

            modelBuilder.Entity("FiniteBlog.Models.PostDrawing", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("char(36)");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("datetime(6)");

                    b.Property<string>("CreatedByFingerprint")
                        .IsRequired()
                        .HasColumnType("longtext");

                    b.Property<double>("PositionX")
                        .HasColumnType("double");

                    b.Property<double>("PositionY")
                        .HasColumnType("double");

                    b.Property<Guid>("PostId")
                        .HasColumnType("char(36)");

                    b.Property<string>("Text")
                        .IsRequired()
                        .HasColumnType("longtext");

                    b.HasKey("Id");

                    b.HasIndex("PostId");

                    b.ToTable("PostDrawings");
                });

            modelBuilder.Entity("FiniteBlog.Models.PostViewer", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("char(36)");

                    b.Property<string>("BrowserFingerprint")
                        .IsRequired()
                        .HasColumnType("longtext");

                    b.Property<Guid>("PostId")
                        .HasColumnType("char(36)");

                    b.Property<DateTime>("ViewedAt")
                        .HasColumnType("datetime(6)");

                    b.Property<string>("VisitorId")
                        .IsRequired()
                        .HasColumnType("longtext");

                    b.HasKey("Id");

                    b.HasIndex("PostId");

                    b.ToTable("PostViewers");
                });

            modelBuilder.Entity("FiniteBlog.Models.PostDrawing", b =>
                {
                    b.HasOne("FiniteBlog.Models.AnonymousPost", "Post")
                        .WithMany("Drawings")
                        .HasForeignKey("PostId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Post");
                });

            modelBuilder.Entity("FiniteBlog.Models.PostViewer", b =>
                {
                    b.HasOne("FiniteBlog.Models.AnonymousPost", "Post")
                        .WithMany("Viewers")
                        .HasForeignKey("PostId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Post");
                });

            modelBuilder.Entity("FiniteBlog.Models.AnonymousPost", b =>
                {
                    b.Navigation("Drawings");

                    b.Navigation("Viewers");
                });
#pragma warning restore 612, 618
        }
    }
}
